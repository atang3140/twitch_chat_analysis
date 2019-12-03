from flask import Flask, render_template, redirect, request, url_for, Response, jsonify
from time import sleep
import tca

app = Flask(__name__)
thread = {}

# state code
INVALID_VOD_NUM = 0
ALREADY_DOWNLOADED = 1
NOW_DOWNLORADING = 2
DOWNLOAD_ERROR = 3
START_DOWNLOAD = 4

@app.route('/')
def index():
    return render_template('index.html', info='트위치 영상 주소의 끝 번호를 입력해 주세요')


@app.route('/download', methods=['POST'])
def download():
    if request.method == 'POST':
        vod_num = request.form['vod']
    else:
        vod_num = None

    # 유효한 vod_num인지 검사
    info = tca.get_vod_info(vod_num)
    if not info:
        # Ajax 응답
        return jsonify(vod=vod_num, state=INVALID_VOD_NUM, info='VOD 번호를 확인해 주세요')
        # return Response("영상이 없습니다", mimetype='text/plain')
        # return render_template('index.html', vod=vod_num, state="다운로드_실패", info="영상을 찾을 수 없습니다")

    # 이미 download가 완료된 경우
    if tca.already_downloaded(vod_num):
        if thread.get(vod_num):
            del thread[vod_num]
        return jsonify(vod=vod_num, state=ALREADY_DOWNLOADED, info=info)

    # 같은 이름의 thread가 이미 생성되어 있는 경우
    if thread.get(vod_num):
        # thread가 아직 종료되지 않은 경우
        if thread[vod_num].is_alive():
            return jsonify(vod=vod_num, state=NOW_DOWNLORADING, info=info)
            # return render_template('index.html', vod=vod_num, state="다운로드_중", info=info)
        # thread가 종료된 경우 - 비정상 종료
        else:
            del thread[vod_num]
            return jsonify(vod=vod_num, state=DOWNLOAD_ERROR, info=info)
            # return render_template('index.html', vod=vod_num, state="다운로드_에러", info=info)
    # 생성된 thread가 없는 경우
    else:
        # Thread 추가 및 시작(key 값: vod_num)
        thread[vod_num] = tca.Downloader(vod_num)
        thread[vod_num].setDaemon(True)
        thread[vod_num].start()

        return jsonify(vod=vod_num, state=START_DOWNLOAD, info=info)


@app.route('/analysis', methods=['POST'])
def analysis():
    if request.method == 'POST':
        vod_num = request.form['vod']
    else:
        vod_num = None
    return render_template('d3_hist.html', vod=vod_num)


@app.route('/stream/')
@app.route('/stream/<vod>')
def stream(vod=None):

    def eventStream(vod_num):
        while True:
            # print(vod_num)
            sleep(1.0)
            if thread.get(vod_num):
                yield 'data: {}\n\n'.format(thread[vod_num].progress)
            else:
                yield 'event: close\ndata: {}\n\n'.format('No')

    vod_num = vod
    return Response(eventStream(vod_num), mimetype="text/event-stream")


if __name__ == '__main__':
    app.run(host='192.168.1.77', port=9876)

import twitch
import os
import datetime
import threading

lock = threading.Lock()

def already_downloaded(vod_num):
    # 다운로드된 파일이 존재하는 경우
    return os.path.isfile('./static/download/' + vod_num + '.csv')


def get_vod_info(vod_num, twitch_id='9k8fhtcsrjfgip3v1jrs1ut33yzs7c'):
    try:
        helix = twitch.Helix(twitch_id)
        vod = helix.video(vod_num)

        # 유효한 vod가 아닌 경우
        if vod is None:
            return ''

        return vod.user_name + ': ' + vod.title
    except:
        return ''


class Downloader(threading.Thread):
    def __init__(self, vod_num, twitch_id='9k8fhtcsrjfgip3v1jrs1ut33yzs7c', name=''):
        threading.Thread.__init__(self, name=name)
        # 반드시 threading.Thread의 초기화 함수가 포함되어야 한다
        self.vod_num = vod_num
        self.progress = 0
        self.twitch_id = twitch_id
        self.status = "waiting"

    def run(self):
        try:
            helix = twitch.Helix(self.twitch_id)
            vod = helix.video(self.vod_num)

            if vod is None:
                self.status = 'error'
                return

            start = datetime.datetime.strptime(
                vod.created_at[:19], '%Y-%m-%dT%H:%M:%S')

            duration = self.str2sec(vod.duration)
            file_name = './static/download/' + self.vod_num
            with open(file_name + '.tmp', 'w', encoding='utf8') as f:
                f.write('comment_time' + '\n')

                for comment in vod.comments:
                    comment_time = datetime.datetime.strptime(
                        comment.updated_at[:19], '%Y-%m-%dT%H:%M:%S')
                    comment_sec = int(
                        (comment_time - start).total_seconds())
                    f.write(str(comment_sec) + '\n')
                    with lock:
                        self.progress = round(comment_sec / duration * 100, 2)

            os.rename(file_name + '.tmp', file_name + '.csv')
            self.status = 'complete'
            return

        # 기타 error가 발생한 경우
        except Exception as ex:
            print('Downloader ERROR')
            print(ex)
            self.status = 'error'
            return

    def str2sec(self, t):
        t1 = t.split('h')
        t2 = t1[1].split('m')
        t3 = t2[1].split('s')
        sec = int(t1[0]) * 3600 + int(t2[0]) * 60 + int(t3[0])
        return sec

var eventSource = {};
var state = [
  '유효한 VOD 번호가 아닙니다. 한번 더 확인해주세요!',
  '다운로드가 완료되었습니다. [요청] 버튼을 한번 더 눌러서 분석합니다.',
  '다운로드 중입니다...',
  '다운로드 도중 오류가 발생했습니다. 다시 다운로드해 주세요.',
  '다운로드를 시작합니다...'
];
function isEmptyObject(param) {
  return Object.keys(param).length === 0 && param.constructor === Object;
}

function sseRequest(vod_num) {
  // 이전 요청이 존재한다면 close 해준다
  if (!isEmptyObject(eventSource)) {
    eventSource.close();
  }

  var path = "/stream/" + vod_num;
  eventSource = new EventSource(path);

  eventSource.onmessage = function (e) {
    document.getElementById("progress").innerHTML = e.data + '%';
  };
  eventSource.addEventListener('close', function (e) {
    eventSource.close();
    console.log('eventSource closed');
  });
  eventSource.onerror = function (err) {
    console.error("EventSource failed: ", err);
    eventSource.close();
    console.log('eventSource closed');
  };
}

function sendRequest() {
  // 이전에 다운로드 완료된 번호랑 입력칸의 번호가 동일할 때만 페이지 이동
  if (document.getElementById("vod_input").value == document.getElementById("vod").dataset.value
    && document.getElementById("state").dataset.value == 1) {
    document.getElementById("frm").submit();
  } else {
    var httpRequest = new XMLHttpRequest();

    // 요청
    httpRequest.open("POST", "/download", true);
    httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    httpRequest.send("vod=" + document.getElementById("vod_input").value);

    // 응답
    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == XMLHttpRequest.DONE && httpRequest.status == 200) {
        var contentType = httpRequest.getResponseHeader('content-type');
        if (contentType == 'application/json') {
          var jsonData = JSON.parse(httpRequest.responseText);

          // Data
          document.getElementById('vod').dataset.value = jsonData['vod'];
          document.getElementById('state').dataset.value = jsonData['state'];

          // Display
          document.getElementById('vod').innerHTML = jsonData['vod'];
          document.getElementById('state').innerHTML = state[jsonData['state']];
          document.getElementById('info').innerHTML = jsonData['info'];

          if (jsonData['state'] == 4) {
            sseRequest(jsonData['vod']);
          }

        } else {
          console.log('bad response');
        }

      }
    };
  }
}
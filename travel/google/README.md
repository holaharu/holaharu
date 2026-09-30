# 여행가계부 Google 공동 저장

여행용 Apps Script 프로젝트와 새 Google Sheets를 사용한다. 기존 월별가계부는 수정하지 않는다.

- Code.gs, Index.html, appsscript.json을 별도 Apps Script 프로젝트에 넣는다.
- 나영의 Google 계정으로 setupTravel을 실행한다. 두 계정을 허용 계정으로 등록하고 이미 공유된 여행 저장 시트를 연결한다. Drive 전체 접근 권한은 요청하지 않는다.
- 웹 앱을 **접속한 사용자로 실행**, **Google 계정 사용자 접근**으로 배포한다. 사용자별 최초 Google 승인이 필요하다.
- 완료된 /exec URL을 여행용 GitHub 페이지의 공동 저장 진입 링크로 연결한다. 실제 URL이 발급되기 전에는 연결 완료로 표시하지 않는다.

두 계정의 이메일을 서버에서 검사한다. 익명 접근과 다른 계정의 모든 읽기/쓰기를 차단한다. 여행별 버전을 검사해 다른 사람의 수정 내용을 덮어쓰지 않는다. 실패한 수정은 브라우저에 남기고 저장 완료로 표시하지 않는다.

현재 상태: 여행 전용 웹 앱 배포 및 나영 계정의 공동 저장 연결 확인 완료. 두 계정만 서버에서 읽기/쓰기 허용.

웹 앱: https://script.google.com/macros/s/AKfycbyJMMOKjcYxdfPxaoNVI4MQ4rZjO_NShdOp9vscdqkaAdYM3JT-7L1gRsmqA7paXcyw/exec

저장 시트: https://docs.google.com/spreadsheets/d/1vD4Q22W6GnJfMHol5GfB6IRlz82lqcP1sPcOovG5Qgs/edit

소유자: momothebestdog@gmail.com
편집자: ingansan12@gmail.com

기존 브라우저 기록이 없는 GitHub 방문자는 공동 저장 웹 앱으로 이동한다. 기존 기록이 있으면 백업 버튼과 공동 저장 진입 링크를 표시한다.

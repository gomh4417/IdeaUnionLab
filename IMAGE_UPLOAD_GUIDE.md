# 이미지 업로드 시스템 사용 가이드

## 개요
이 시스템은 Firebase Storage의 `upload` 폴더에 레퍼런스 이미지를 업로드하고, CanvasPage에서 해당 이미지들을 선택할 수 있도록 합니다.

## 파일 구조

```
IdeaUnionLab/
├── upload.html                          # 이미지 업로드 페이지 (독립 실행형)
└── src/
    ├── page/
    │   ├── index.html                   # 이미지 업로드 페이지 (동일 기능)
    │   └── CanvasPage.jsx               # 이미지 선택 모달 포함
    └── utils/
        └── firebaseUpload.js            # Firebase Storage 이미지 목록 가져오기
```

## 주요 기능

### 📱 모바일 최적화
- 모바일 우선 반응형 디자인
- 터치 친화적 UI
- 드래그 앤 드롭 지원
- HomePage의 "새로운 실험하기" 버튼 스타일 적용

### 🎨 UI/UX
- **버튼 스타일**: HomePage와 동일 (width: auto/300px, height: 56px, 파란색)
- **업로드 영역**: 시각적 피드백과 함께 직관적인 인터페이스
- **미리보기**: 선택한 이미지를 업로드 전에 확인
- **상태 표시**: 로딩/성공/실패 메시지

## 사용 방법

### 1. 이미지 업로드하기

**방법 A: 브라우저에서 직접 열기**
```
file:///경로/IdeaUnionLab/upload.html
```

**방법 B: GitHub Pages로 배포**
1. GitHub 저장소에 `upload.html` 업로드
2. Settings → Pages → Deploy from branch
3. 생성된 URL로 접속

**업로드 절차**
1. 이미지 선택 영역 클릭 또는 드래그 앤 드롭
2. JPG, PNG 파일 선택 (최대 10MB)
3. 미리보기 확인
4. "전송" 버튼 클릭
5. 성공 메시지 확인

### 2. CanvasPage에서 이미지 사용하기

1. CanvasPage로 이동합니다

2. 하단 툴바에서 이미지 아이콘(📷)을 클릭합니다

3. 모달 창이 열리며 최근 업로드된 10개의 이미지가 표시됩니다

4. 원하는 이미지를 클릭하면 캔버스에 적용됩니다

## Firebase Storage 구조

```
gs://ideaunionlab.firebasestorage.app/
└── upload/
    ├── 1729820400000_image1.jpg
    ├── 1729820401000_image2.png
    └── ...
```

- 파일명 형식: `{타임스탬프}_{원본파일명}`
- 최신순으로 정렬되어 최대 10개까지 표시

## 주요 기능

### upload.html
- 이미지 선택 및 미리보기
- Firebase Storage에 업로드
- 업로드 상태 표시 (로딩/성공/실패)

### firebaseUpload.js
- `getRecentUploadedImages()`: upload 폴더의 최근 10개 이미지 목록 반환
- 메타데이터를 통한 최신순 정렬
- 에러 처리 및 로깅

### CanvasPage.jsx
- 이미지 선택 모달 UI
- Firebase Storage 이미지 목록 로드
- 선택한 이미지를 캔버스에 적용
- CORS 문제 해결 (data URL 변환)

## 스타일링

모달 UI는 기존 SaveSuccessModal과 동일한 스타일을 사용합니다:
- 배경: `#00000040` (반투명 검정)
- 모달: `#ffffff80` + `backdrop-filter: blur(10px)`
- 이미지 그리드: 5열 레이아웃
- 이미지 크기: 100px × 100px

## 주의사항

1. **CORS 정책**: Firebase Storage의 CORS 설정이 필요할 수 있습니다
2. **파일 크기**: 대용량 이미지는 업로드 시간이 오래 걸릴 수 있습니다
3. **브라우저 호환성**: 최신 브라우저 사용 권장 (Chrome, Firefox, Safari)

## 트러블슈팅

### 이미지가 표시되지 않는 경우
- Firebase Storage 규칙 확인
- CORS 설정 확인
- 브라우저 콘솔에서 에러 확인

### 업로드 실패
- 파일 형식 확인 (PNG, JPEG, JPG만 지원)
- 인터넷 연결 확인
- Firebase 프로젝트 설정 확인

## 개발자 참고사항

### Firebase Storage 규칙 예시
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /upload/{allPaths=**} {
      allow read: if true;  // 누구나 읽기 가능
      allow write: if true; // 누구나 쓰기 가능 (프로덕션에서는 인증 추가 필요)
    }
  }
}
```

### CORS 설정 (필요시)
```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

## 향후 개선 사항

- [ ] 이미지 삭제 기능
- [ ] 페이지네이션 (10개 이상)
- [ ] 이미지 검색/필터링
- [ ] 드래그 앤 드롭 업로드
- [ ] 이미지 편집 기능

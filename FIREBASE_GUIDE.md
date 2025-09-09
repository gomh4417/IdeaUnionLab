# Firebase Firestore 데이터베이스 사용 가이드

## 🔥 Firebase 설정 완료

IdeaUnionLab 프로젝트에 Firebase Firestore 데이터베이스가 성공적으로 통합되었습니다.

## 📁 데이터베이스 구조

```
projects (컬렉션)
└─ {projectId} (문서)
    ├─ name: string
    ├─ description: string (optional)
    ├─ createdAt: timestamp
    ├─ updatedAt: timestamp
    └─ ideas (하위 컬렉션)
        └─ {ideaId} (문서)
            ├─ title: string
            ├─ description: string
            ├─ imageUrl: string (Base64 URL, 1MB 이하)
            ├─ tags: array[string] (예: ["공공", "벤치"])
            ├─ createdAt: timestamp
            └─ experiments (하위 컬렉션)
                └─ {experimentId} (문서)
                    ├─ experimentNumber: number
                    ├─ additive: map
                    │   ├─ type: string (예: "창의성 첨가제")
                    │   ├─ intensity: number (예: 0.5)
                    │   └─ referenceImage: string (Base64 URL)
                    ├─ result: map
                    │   ├─ title: string (AI 결과물 제목)
                    │   ├─ description: string (AI 결과물 설명)
                    │   ├─ imageUrl: string (AI 결과 이미지 URL)
                    │   └─ steps: array[map]
                    │       ├─ stepNumber: number
                    │       ├─ title: string
                    │       └─ description: string
                    └─ createdAt: timestamp
```

## 🛠️ 생성된 파일들

### 1. Firebase 설정
- `src/firebase.js` - Firebase 초기화 설정
- `.env` - Firebase 환경변수 (프로젝트 루트로 이동됨)

### 2. 유틸리티 함수
- `src/firebaseUtils.js` - Firestore CRUD 작업을 위한 함수들

### 3. React Context & Hooks
- `src/contexts/FirebaseContext.jsx` - 전역 상태 관리
- `src/hooks/useFirebase.js` - 커스텀 훅들

### 4. 예시 컴포넌트
- `src/components/FirebaseExampleUsage.jsx` - 사용법 예시

## 🚀 사용 방법

### 1. 기본 사용법

```jsx
import { useProjects, useIdeas, useExperiments } from '../hooks/useFirebase';

const MyComponent = () => {
  const { projects, createProject } = useProjects();
  const { ideas, createIdea } = useIdeas();
  const { experiments, createExperiment } = useExperiments();

  // 프로젝트 생성
  const handleCreateProject = async () => {
    await createProject("프로젝트 이름", "프로젝트 설명");
  };

  // 아이디어 생성
  const handleCreateIdea = async () => {
    await createIdea("proj_001", {
      title: "아이디어 제목",
      description: "아이디어 설명",
      imageUrl: "data:image/png;base64,...",
      tags: ["태그1", "태그2"]
    });
  };

  return (
    <div>
      {/* 컴포넌트 내용 */}
    </div>
  );
};
```

### 2. 이미지 업로드 (1MB 이하)

```jsx
import { useImageUpload } from '../hooks/useFirebase';

const ImageUploadComponent = () => {
  const { uploadImage, uploading } = useImageUpload();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    try {
      const imageUrl = await uploadImage(file);
      // imageUrl을 데이터베이스에 저장
    } catch (error) {
      console.error("업로드 실패:", error);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileUpload}
      disabled={uploading}
    />
  );
};
```

### 3. 실험 생성

```jsx
import { useExperiments, useExperimentSteps } from '../hooks/useFirebase';

const ExperimentComponent = () => {
  const { createExperiment } = useExperiments();
  const { steps, addStep } = useExperimentSteps();

  const handleCreateExperiment = async () => {
    // 단계 추가
    addStep("원재료 분석", "문제점 분석");
    addStep("TRIZ 혼합", "TRIZ 원리 적용");

    // 실험 생성
    await createExperiment("proj_001", "idea_001", {
      additiveType: "창의성 첨가제",
      intensity: 0.5,
      referenceImage: "data:image/png;base64,...",
      resultTitle: "개선된 아이디어",
      resultDescription: "AI 개선 결과",
      resultImageUrl: "data:image/png;base64,...",
      steps: steps
    });
  };

  return (
    <button onClick={handleCreateExperiment}>
      실험 생성
    </button>
  );
};
```

## 🔑 ID 생성 규칙

- **프로젝트 ID**: `proj_001`, `proj_002`, ...
- **아이디어 ID**: `idea_001`, `idea_002`, ...
- **실험 ID**: `exp_001`, `exp_002`, ...

ID는 자동으로 순차적으로 생성되며, 직접 지정한 형식을 따릅니다.

## ⚠️ 주의사항

1. **이미지 크기**: 모든 이미지는 1MB 이하로 제한됩니다.
2. **환경변수**: `.env` 파일이 프로젝트 루트에 있어야 합니다.
3. **Firebase 규칙**: Firestore 보안 규칙을 적절히 설정해주세요.

## 🧪 테스트

Firebase 연동을 테스트하려면:

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 `FirebaseExampleUsage` 컴포넌트 확인
3. 콘솔에서 데이터 생성/조회 테스트

## 📚 추가 리소스

- [Firebase 문서](https://firebase.google.com/docs)
- [Firestore 가이드](https://firebase.google.com/docs/firestore)
- [React Firebase 훅](https://github.com/CSFrequency/react-firebase-hooks)

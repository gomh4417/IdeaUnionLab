# IdeaUnionLab

- AI 기반 제품 아이디어 개선 서비스입니다. 창의성, 심미성, 사용성 첨가제를 통해 기존 아이디어를 발전시킵니다.
- LabPage.jsx에서 선택한 첨가제에 따라 적용하는 방법론이 달라진다(=프롬프트가 달라진다)

## API 지원

### OpenAI GPT-4o-mini (기본)
- CanvasPage.jsx에서 아이디어를 추가(등록)하면 vision API를 통해 이미지를 분석하고, visionAnalysis에 저장합니다.
- gemini의 이미지 생성 API를 호출하기 위한 프롬프트를 작성하기 전, 프롬프트 전문을 영어로 번역하여 제공하는 역할을 합니다.
- LabPage.jsx에서 첨가제를 선택하고, 실험하기 버튼을 눌렀을 때, DropItem의 title과 description, visionAnalysis 데이터와 Aiapi.js에 사전에 작성한 방법론 프롬프트를 사용하여 json 구조 별 지시에 따라 결과를 출력해야 합니다.
- ResultPage.jsx에서 step1~4까지의 json 구조로 출력된 응답 값 중 step4의 데이터와 LabPage.jsx에서 실험하기를 진행하기 전 Drop했던 DropItem의 title과 description을 바탕으로 기존의 문제점이 개선된 발전된 결과물 아이디어의 title과 description을 출력해야합니다.
- step4와 개선된 발전된 결과물 아이디어의 title과 description을 바탕으로 원래 아이디어 였던 DropItem의 Image가 어떻게 수정되어야 할지 프롬프트로 제공해야합니다.

### Google Gemini 2.5-Flash (선택사항)
- 이미지 수정 지시사항을 텍스트 프롬프트로 기존 DropItem의 ImageUrl을 참조이미지 프롬프트로 활용하여 개선된 제품 이미지를 출력해야합니다.
- 드롭된 아이디어 이미지를 참조하여 개선된 이미지 생성
- promptTest 스타일 프롬프트 지원
- ResultPage에서 이미지 생성 전담

### Stability AI (IFL 전용)
- Canvas Page의 IFL(아이디어 생성) 버튼에서만 사용
- 고품질 제품 이미지 생성해야 합니다.
- 배경 요소 없이 제품 1개만을 단독적으로 출력해야합니다.

## 환경 설정
`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# OpenAI API 설정
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Stability AI API 설정 (이미지 생성용)
VITE_STABILITY_API_KEY=your_stability_api_key_here

# Google Gemini API 설정
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# API 선택 (true: Gemini 사용, false: OpenAI 사용)
VITE_USE_GEMINI_API=false
```

## 첨가제별 기능

### 창의성 첨가제
- TRIZ 40가지 발명 원리 적용
- 4단계 분석: 기존 DropItem의 문제점 분석 → TRIZ 적용하여 어떻게 해결될 수 있을지에 대한 안내 → TRIZ를 적용하여 기존 DropItem의 문제를 정의 → 앞선 내용을 바탕으로 어떻게 해결할 수 있을지에 대한 인사이트 도출

### 심미성 첨가제  
- 스키마 기반 심미성 원리 적용
- 레퍼런스 이미지 분석 지원
- 시각적 특징 및 디자인 개선 방향 제시

### 사용성 첨가제
- Task Analysis 과제 분석법 적용
- 5단계 사용자 시나리오 분석
- UX 문제점 및 개선 인사이트 도출

## Firebase 설정
Firebase 프로젝트 설정 후 `src/firebase.js`에서 config 정보를 업데이트하세요.

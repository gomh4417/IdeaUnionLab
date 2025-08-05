const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";

// 슬라이더 값을 Temperature로 변환
const getTemperatureFromSlider = (sliderValue) => {
  const temperatureMap = {
    0: 0.3,
    1: 0.7,
    2: 1.0
  };
  return temperatureMap[sliderValue] || 0.7;
};

// 공통 프롬프트
const VISION_PROMPT = `당신은 제품 디자인 전문가입니다.
제공된 이미지를 분석하여 시각적 정보를 텍스트로 설명하세요. 

### 분석 기준
1. 제품의 형태(형상, 구조, 주요 구성 요소)를 구체적으로 설명합니다.
2. 재질(Material), 색상(Color), 질감(Texture)과 같은 시각적 특징을 명확히 작성합니다.
3. 기능적 요소(예: 손잡이, 버튼, 받침대 등)와 사용성을 추론할 수 있는 특징을 설명합니다.
4. 시각적으로 눈에 띄는 문제점(예: 불편해 보이는 부분, 불균형 등)을 포함합니다.

### 출력 조건
- 불필요한 문장은 제거하고, 명확한 사실 위주로 작성합니다.
- 최대 5줄 이내의 간결한 텍스트로 작성합니다.
- JSON이나 코드 블록 없이 순수 텍스트만 출력합니다.`;

// 창의성 첨가제 프롬프트
const ADDITIVE_PROMPTS = {
  creativity: (ideaTitle, ideaDescription, visionResult) => `당신은 제품 디자인 전문가이자 TRIZ 창의적 문제 해결 기법 전문가입니다. 
다음 정보를 기반으로 사용자의 아이디어를 분석하고, 4단계로 나눈 상세한 JSON을 작성하세요.

### 사용자가 작성한 아이디어의 설명
제목: ${ideaTitle}
설명: ${ideaDescription}

### 이미지 분석 결과
${visionResult}

### JSON 출력 형식 (반드시 이 형식을 따라 주세요)
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "이 아이디어에 대한 총평을 한 문장으로 (예: 짧은 시간 동안 가볍게 읽기 위한 제품이에요!)",
      "description": "현재 아이디어의 핵심 특징, 장점, 문제점을 종합적으로 분석합니다. 어떤 상황에서 사용되는 제품인지, 주요 기능과 한계점을 4-5문장으로 구체적으로 서술하세요."
    },
    {
      "stepNumber": 2,
      "title": "창의성 첨가제를 적용할 예정입니다",
      "description": "구체적인 TRIZ 발명 원리(예: 분할, 국소품질, 비대칭, 통합, 다용도성 등)를 1-2개 선정하고, 왜 이 원리들이 현재 아이디어에 적합한지 설명합니다. 어떤 부분에 적용할 예정인지 계획을 3-4문장으로 서술하세요."
    },
    {
      "stepNumber": 3,
      "title": "실제 적용 과정의 제목 (예: 책을 찾기 어려웠어요)",
      "subSteps": [
        {
          "title": "앉을 곳이 없었어요 - 앞선 예시처럼 구체적인 문제점이나 개선 과정을 작성",
          "description": "첫 번째 개선 단계를 구체적으로 설명합니다. 어떤 문제를 어떻게 해결했는지 2-3문장으로 서술하세요."
        },
        {
          "title": "앉을 곳이 없었어요 - 앞선 예시처럼 구체적인 문제점이나 개선 과정을 작성",
          "description": "두 번째 개선 단계를 구체적으로 설명합니다. 추가적인 개선 사항이나 보완점을 2-3문장으로 서술하세요."
        },
        {
          "title": "앉을 곳이 없었어요 - 앞선 예시처럼 구체적인 문제점이나 개선 과정을 작성하지만, 최종 통합 과정을 요약하는 한 문장을 작성",
          "description": "세 번째 개선 단계나 최종 통합 과정을 설명합니다. 모든 개선 사항을 어떻게 조화롭게 결합했는지 서술하세요."
        }
      ]
    },
    {
      "stepNumber": 4,
      "title": "TRIZ 원리로 개선 방향성을 찾았어요! (또는 구체적인 인사이트)",
      "description": "Step 1-3을 통해 발견된 문제점과 현재 상황을 바탕으로, 앞으로 어떻게 해결할 수 있는 방향성과 인사이트를 제시합니다. 어떤 핵심 개선 포인트를 발견했는지, 어떤 새로운 접근 방법이 가능한지 4-5문장으로 상세히 서술하세요."
    }
  ]
}

### 작성 규칙
1. 위의 JSON 형식을 정확히 따라 주세요.
2. Step 1: 아이디어에 대한 총평과 현상 분석
3. Step 2: 적용할 TRIZ 원리 선정과 적용 계획 (실제 적용 X, 계획만)
4. Step 3: 실제 TRIZ 원리 적용 과정을 3개의 subSteps로 구체화
5. Step 4: Step 1-3을 통해 발견된 문제점과 상황을 바탕으로 개선 방향성과 인사이트 제시
6. 모든 description은 최소 3문장 이상으로 구체적으로 작성하세요.
7. 응답에 자신을 지칭하는 표현(예: "저는", "제가")은 사용하지 마세요.
8. JSON 외의 다른 텍스트는 포함하지 마세요.
9. **중요: JSON이 완전한 형태로 닫혀야 합니다. 모든 중괄호와 대괄호가 올바르게 닫혀있는지 확인하세요.**
10. **Step 3에는 반드시 "subSteps" 배열이 있어야 하며, 3개의 객체가 포함되어야 합니다.**`,


// 심미성 첨가제 프롬프트
  aesthetics: (ideaTitle, ideaDescription, visionResult, referenceResult) => `당신은 제품 디자인 전문가이자 사례 기반 추론(Schema)과 심미성 분석 전문가입니다. 
다음 정보를 기반으로 사용자의 아이디어를 분석하고, 4단계로 나눈 상세한 JSON을 작성하세요.

### 사용자가 작성한 아이디어의 설명
제목: ${ideaTitle}
설명: ${ideaDescription}

### 이미지 분석 결과
${visionResult}

### 레퍼런스 이미지 분석 결과
${referenceResult}

### JSON 출력 형식 (반드시 이 형식을 따라 주세요)
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "이 아이디어에 대한 총평을 한 문장으로",
      "description": "현재 아이디어의 시각적 특징, 디자인 스타일, 심미적 장단점을 종합적으로 분석합니다. 어떤 느낌을 주는 디자인인지, 개선이 필요한 심미적 요소는 무엇인지 4-5문장으로 구체적으로 서술하세요."
    },
    {
      "stepNumber": 2,
      "title": "심미성 첨가제를 적용할 예정입니다",
      "description": "레퍼런스 이미지의 핵심 디자인 요소(색상, 형태, 질감, 스타일 등)를 분석하고, 현재 아이디어의 어떤 부분에 어떻게 적용할 예정인지 계획을 설명합니다. 3-4문장으로 구체적인 적용 방향을 서술하세요."
    },
    {
      "stepNumber": 3,
      "title": "실제 심미성 개선 과정의 제목",
      "subSteps": [
        {
          "title": "첫 번째 심미적 개선 사항 (예: 색상 조화 개선)",
          "description": "첫 번째 심미적 개선 단계를 구체적으로 설명합니다. 어떤 디자인 요소를 어떻게 개선했는지 2-3문장으로 서술하세요."
        },
        {
          "title": "두 번째 심미적 개선 사항 (예: 형태 비율 조정)",
          "description": "두 번째 심미적 개선 단계를 구체적으로 설명합니다. 추가적인 시각적 개선 사항을 2-3문장으로 서술하세요."
        },
        {
          "title": "세 번째 심미적 개선 사항 (예: 질감과 마감 처리)",
          "description": "세 번째 개선 단계나 최종 디테일 완성 과정을 설명합니다. 모든 심미적 요소를 어떻게 조화롭게 결합했는지 서술하세요."
        }
      ]
    },
    {
      "stepNumber": 4,
      "title": "레퍼런스 기반으로 개선 방향성을 찾았어요!",
      "description": "Step 1-3을 통해 발견된 디자인 문제점과 현재 상황을 바탕으로, 앞으로 어떻게 심미적으로 개선할 수 있는 방향성과 인사이트를 제시합니다. 어떤 핵심 디자인 개선 포인트를 발견했는지, 어떤 새로운 디자인 접근 방법이 가능한지 4-5문장으로 상세히 서술하세요."
    }
  ]
}

### 작성 규칙
1. 위의 JSON 형식을 정확히 따라 주세요.
2. Step 1: 현재 디자인에 대한 총평과 심미적 분석
3. Step 2: 레퍼런스 기반 심미성 개선 계획 (실제 적용 X, 계획만)
4. Step 3: 실제 심미적 개선 과정을 3개의 subSteps로 구체화
5. Step 4: Step 1-3을 통해 발견된 디자인 문제점과 상황을 바탕으로 심미적 개선 방향성과 인사이트 제시
6. 모든 description은 최소 3문장 이상으로 구체적으로 작성하세요.
7. 응답에 자신을 지칭하는 표현(예: "저는", "제가")은 사용하지 마세요.
8. JSON 외의 다른 텍스트는 포함하지 마세요.`,


// 사용성 첨가제 프롬프트
  usability: (ideaTitle, ideaDescription, visionResult) => `당신은 제품 디자인 전문가이자 사용성(Task Analysis) 분석 전문가입니다. 
다음 정보를 기반으로 사용자의 아이디어를 분석하고, 4단계로 나눈 상세한 JSON을 작성하세요.

### 사용자가 작성한 아이디어의 설명
제목: ${ideaTitle}
설명: ${ideaDescription}

### 이미지 분석 결과
${visionResult}

### JSON 출력 형식 (반드시 이 형식을 따라 주세요)
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "이 아이디어에 대한 총평을 한 문장으로",
      "description": "현재 아이디어의 사용성 측면에서 장점과 문제점을 종합적으로 분석합니다. 어떤 사용 맥락에서 효과적인지, 사용자가 겪을 수 있는 불편함은 무엇인지 4-5문장으로 구체적으로 서술하세요."
    },
    {
      "stepNumber": 2,
      "title": "사용성 첨가제를 적용할 예정입니다",
      "description": "과제 분석법(Task Analysis)을 활용하여 사용자가 이 제품을 실제로 사용할 때의 시나리오 흐름을 1단계부터 5단계까지 분석하고, 각 단계에서 발생할 수 있는 문제점을 식별한 과정을 설명하세요. 이 분석을 통해 발견한 문제점과 그 의미를 3-4문장으로 구체적으로 서술하세요. 단순한 해결책 제시보다는 '사용 흐름에서 문제를 찾아냈다'는 분석 중심의 내용을 강조하세요."
    },
    {
      "stepNumber": 3,
      "title": "사용자 흐름에 따라 개선이 필요했어요!와 같이 과제 분석법을 활용하여 아이디어를 생각했을때, descriptions의 내용을 요약하여 설명할 수 있는 결론적인 한 문장을 작성하세요.",
      "descriptions": [
        "1단계: 첫 번째 사용자 행동과 관련된 문제와 개선 설명 (2-3문장으로 구체적으로 작성)",
        "2단계: 두 번째 사용자 행동과 관련된 문제와 개선 설명 (2-3문장으로 구체적으로 작성)",
        "3단계: 세 번째 사용자 행동과 관련된 문제와 개선 설명 (2-3문장으로 구체적으로 작성)",
        "4단계: 네 번째 사용자 행동과 관련된 문제와 개선 설명 (2-3문장으로 구체적으로 작성)",
        "5단계: 다섯 번째 사용자 행동과 관련된 문제와 개선 설명 (2-3문장으로 구체적으로 작성)"
      ]
    },
    {
      "stepNumber": 4,
      "title": "태스크 분석으로 개선 방향성을 찾았어요!",
      "description": "Step 1-3을 통해 발견된 사용성 문제점과 현재 상황을 바탕으로, 앞으로 어떻게 사용성을 개선할 수 있는 방향성과 인사이트를 제시합니다. 어떤 핵심 사용성 개선 포인트를 발견했는지, 어떤 새로운 UX 접근 방법이 가능한지 4-5문장으로 상세히 서술하세요."
    }
  ]
}

### 작성 규칙
1. 반드시 위의 JSON 구조를 정확히 따르세요.
2. Step 3의 "descriptions"는 정확히 5개의 문자열 배열로 구성하세요.
3. 각 descriptions 항목은 "X단계:"로 시작하여 단계별 사용자 행동과 개선 내용을 2-3문장으로 구체적으로 작성하세요.
4. JSON 외의 다른 텍스트는 절대 포함하지 마세요.
5. 모든 description과 descriptions 항목은 자연스럽고 구체적인 문장으로 작성하세요.
6. 응답에 자신을 지칭하는 표현(예: "저는", "제가")은 사용하지 마세요.
7. descriptions의 각 항목은 독립적인 문자열이며, 객체가 아닙니다.`
};

// Vision API 호출 (이미지 분석)
export async function analyzeImageWithVision(imageUrl) {
    try {
        console.log('Vision API 호출 시작:', imageUrl.substring(0, 50) + '...');
        
        const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: "gpt-4o", 
            messages: [
            {
                role: "system",
                content: VISION_PROMPT
            },
            {
                role: "user",
                content: [
                { type: "text", text: "이 이미지를 위의 기준에 따라 분석해 주세요." },
                { type: "image_url", image_url: { url: imageUrl } }
                ]
            }
            ],
            max_tokens: 300,
        }),
    });

    if (!response.ok) {
        throw new Error(`Vision API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('Vision API 응답 완료');
        return data.choices[0].message.content;
    } catch (error) {
    console.error('Vision API 호출 실패:', error);
    throw error;
    }
}

// 아이디어 분석 (텍스트 처리)
export async function generateIdeaWithAdditive(additiveType, ideaTitle, ideaDescription, visionResult, referenceResult = null, sliderValue = 1) {
    try {
        console.log('아이디어 생성 API 호출 시작:', additiveType, '슬라이더 값:', sliderValue);
        
        let prompt;
        if (additiveType === 'aesthetics' && referenceResult) {
        prompt = ADDITIVE_PROMPTS.aesthetics(ideaTitle, ideaDescription, visionResult, referenceResult);
        } else {
        prompt = ADDITIVE_PROMPTS[additiveType](ideaTitle, ideaDescription, visionResult);
        }

    // 슬라이더 값을 Temperature로 변환
    const temperature = getTemperatureFromSlider(sliderValue);
    console.log('Temperature 설정:', temperature);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", 
        messages: [
          { 
            role: "system", 
            content: "당신은 정확한 JSON 형식으로만 응답하는 AI입니다. JSON 외의 다른 텍스트는 절대 포함하지 마세요." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 3000, 
        temperature: temperature, // 슬라이더 값에 따른 동적 Temperature
      }),
    });

    if (!response.ok) {
      throw new Error(`아이디어 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('아이디어 생성 API 응답 완료');
    
    let responseText = data.choices[0].message.content.trim();
    
    // JSON 코드 블록이 있다면 제거
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('정제된 응답:', responseText);
    
    // JSON 파싱 시도
    try {
      const result = JSON.parse(responseText);
      
      console.log('JSON 파싱 성공, 구조 검증 시작...');
      
      // 구조 검증
      if (!result.steps || !Array.isArray(result.steps) || result.steps.length !== 4) {
        if (process.env.NODE_ENV === 'development') {
          console.error('응답 구조 오류:', {
            hasSteps: !!result.steps,
            isArray: Array.isArray(result.steps),
            length: result.steps?.length
          });
        }
        throw new Error('응답 구조가 올바르지 않습니다.');
      }
      
      console.log('기본 구조 검증 완료, 각 step 검증 시작...');
      
      // 각 step의 필수 필드 검증
      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i];
        if (process.env.NODE_ENV === 'development') {
          console.log(`Step ${i + 1} 검증 중:`, {
            stepNumber: step.stepNumber,
            hasTitle: !!step.title,
            hasDescription: !!step.description,
            hasDescriptions: !!step.descriptions,
            hasSubSteps: !!step.subSteps,
            additiveType
          });
        }
        
        if (!step.stepNumber || !step.title) {
          throw new Error(`Step ${i + 1}에 필수 필드가 누락되었습니다.`);
        }
        
        // stepNumber가 3이 아닌 경우 description 필드 체크
        if (step.stepNumber !== 3 && !step.description) {
          throw new Error(`Step ${i + 1}에 description 필드가 누락되었습니다.`);
        }
        
        // step3 구조 검증 및 보정
        if (step.stepNumber === 3) {
          // 사용성 첨가제의 경우 descriptions 배열이 있어야 함
          if (additiveType === 'usability') {
            if (step.descriptions && Array.isArray(step.descriptions)) {
              // descriptions 배열이 5개 항목을 가져야 함
              if (step.descriptions.length !== 5) {
                console.warn('Step 3에 descriptions가 5개가 아닙니다. 기본 구조로 대체합니다.');
                step.descriptions = [
                  "1단계: 사용자가 제품에 처음 접근할 때의 문제점을 개선했습니다.",
                  "2단계: 주요 기능 사용 과정에서의 불편함을 해결했습니다.",
                  "3단계: 사용 중 발생하는 혼란을 줄이는 개선을 진행했습니다.",
                  "4단계: 사용 후 정리나 보관 과정을 개선했습니다.",
                  "5단계: 전체적인 사용자 경험을 통합하고 최적화했습니다."
                ];
              }
            } else {
              // descriptions가 없는 경우 기본 구조로 대체
              console.warn('사용성 첨가제 Step 3에 descriptions가 없습니다. 기본 구조로 대체합니다.');
              step.descriptions = [
                "1단계: 사용자가 제품에 처음 접근할 때의 문제점을 개선했습니다.",
                "2단계: 주요 기능 사용 과정에서의 불편함을 해결했습니다.",
                "3단계: 사용 중 발생하는 혼란을 줄이는 개선을 진행했습니다.",
                "4단계: 사용 후 정리나 보관 과정을 개선했습니다.",
                "5단계: 전체적인 사용자 경험을 통합하고 최적화했습니다."
              ];
            }
          } else {
            // 창의성, 심미성 첨가제의 경우 subSteps 구조를 사용
            if (step.subSteps && Array.isArray(step.subSteps)) {
              if (step.subSteps.length !== 3) {
                console.warn('Step 3에 subSteps가 3개가 아닙니다. 기본 구조로 대체합니다.');
                step.subSteps = [
                  {
                    title: "1차 혼합: 기본 구조 개선",
                    description: "기존 아이디어의 기본 구조나 형태를 개선하는 과정입니다."
                  },
                  {
                    title: "2차 혼합: 기능적 요소 추가",
                    description: "새로운 기능이나 사용성을 향상시키는 요소를 추가합니다."
                  },
                  {
                    title: "3차 혼합: 통합 및 최적화",
                    description: "모든 요소를 통합하고 최적화하는 과정입니다."
                  }
                ];
              }
            } else {
              // subSteps가 없는 경우 기본 구조로 대체
              console.warn('창의성/심미성 첨가제 Step 3에 subSteps가 없습니다. 기본 구조로 대체합니다.');
              step.subSteps = [
                {
                  title: "1차 혼합: 기본 구조 개선",
                  description: "기존 아이디어의 기본 구조나 형태를 개선하는 과정입니다."
                },
                {
                  title: "2차 혼합: 기능적 요소 추가",
                  description: "새로운 기능이나 사용성을 향상시키는 요소를 추가합니다."
                },
                {
                  title: "3차 혼합: 통합 및 최적화",
                  description: "모든 요소를 통합하고 최적화하는 과정입니다."
                }
              ];
            }
          }
        }
      }
      
      console.log('모든 step 검증 완료, 구조 보정 시작...');
      
      return result;
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('원본 응답:', responseText);
      console.error('응답 길이:', responseText.length);
      console.error('응답 앞부분 (200자):', responseText.substring(0, 200));
      console.error('응답 뒷부분 (200자):', responseText.substring(responseText.length - 200));
      
      // JSON 복구 시도
      try {
        // JSON이 잘린 경우를 대비해 마지막 닫는 괄호들 추가 시도
        let fixedJson = responseText;
        
        // 가장 많이 발생하는 문제: 마지막 }] 누락
        if (!fixedJson.trim().endsWith('}]}')) {
          if (fixedJson.includes('"steps"') && !fixedJson.trim().endsWith('}')) {
            fixedJson = fixedJson.trim() + '}]}';
          } else if (fixedJson.includes('"steps"') && !fixedJson.trim().endsWith(']')) {
            fixedJson = fixedJson.trim() + ']}';
          }
        }
        
        // 다시 파싱 시도
        const recoveredResult = JSON.parse(fixedJson);
        console.log('JSON 파싱 오류 디버깅');
        
        // 기본 구조 검증 및 보정
        if (!recoveredResult.steps || !Array.isArray(recoveredResult.steps)) {
          throw new Error('복구된 JSON도 올바르지 않습니다');
        }
        
        // 4개 step이 없으면 기본 구조로 채움
        while (recoveredResult.steps.length < 4) {
          const stepNumber = recoveredResult.steps.length + 1;
          recoveredResult.steps.push({
            stepNumber,
            title: `Step ${stepNumber} 분석`,
            description: `Step ${stepNumber}에 대한 분석 내용입니다.`
          });
        }
        
        return recoveredResult;
        
      } catch (recoveryError) {
        console.error('JSON 복구도 실패:', recoveryError);
        
        // 최종 실패 시 기본 구조 반환
        return {
          steps: [
            {
              stepNumber: 1,
              title: "아이디어 분석 중 오류 발생",
              description: "AI 분석 중 일시적인 오류가 발생했습니다. 다시 시도해주세요."
            },
            {
              stepNumber: 2,
              title: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 첨가제 적용 계획`,
              description: "첨가제 적용을 위한 분석이 진행됩니다."
            },
            {
              stepNumber: 3,
              title: "적용 과정",
              ...(additiveType === 'usability' ? {
                descriptions: [
                  "1단계: 기본 사용성 개선",
                  "2단계: 인터페이스 최적화", 
                  "3단계: 사용자 경험 향상",
                  "4단계: 접근성 개선",
                  "5단계: 전체 통합"
                ]
              } : {
                subSteps: [
                  { title: "1차 개선", description: "기본 구조 개선" },
                  { title: "2차 개선", description: "기능 요소 추가" },
                  { title: "3차 개선", description: "통합 및 최적화" }
                ]
              })
            },
            {
              stepNumber: 4,
              title: "개선 방향성",
              description: "분석을 통해 발견된 개선 방향을 제시합니다."
            }
          ]
        };
      }
    }
  } catch (error) {
    console.error('아이디어 생성 API 호출 실패:', error);
    
    // API 호출 실패 시 오류 throw
    throw error;
  }
}

// 레퍼런스 이미지 분석 (심미성 첨가제용 vision API)
export async function analyzeReferenceImage(imageUrl) {
  try {
    console.log('레퍼런스 이미지 분석 시작:', imageUrl.substring(0, 50) + '...');
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [
          {
            role: "system",
            content: "당신은 디자인 전문가입니다. 제공된 레퍼런스 이미지의 심미적 특징을 분석하세요."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "이 레퍼런스 이미지의 디자인 형태, 색상, 재질, 스타일적 특징을 간결하게 설명해 주세요." },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`레퍼런스 이미지 분석 API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('레퍼런스 이미지 분석 완료');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('레퍼런스 이미지 분석 실패:', error);
    throw error;
  }
}

// Vision 분석 결과를 바탕으로 제품 태그 생성
export async function generateProductTag(visionAnalysis) {
  try {
    console.log('제품 카테고리 분석 중...');
    
    const tagPrompt = `당신은 제품 카테고리 분석 전문가입니다. 
주어진 제품 분석을 바탕으로 적절한 카테고리 태그를 생성하세요.

### 제품 분석 결과
${visionAnalysis}

### 태그 생성 과정
1. 제품의 주요 기능과 용도를 파악하세요
2. 제품이 사용되는 장소나 상황을 고려하세요  
3. 제품의 크기, 형태적 특성을 반영하세요
4. 사용자층이나 전문성을 고려하세요

### 태그 생성 규칙
- 정확히 4-5글자의 한글 태그를 생성
- "용도+영역" 또는 "특성+분야" 조합으로 구성
- 좋은 예시: "가전제품", "주방제품", "사무도구", "운동기구", "의료장비", "전자기기", "생활가전", "인테리어", "문구용품", "욕실용품", "청소도구", "수납용품", "조명기구", "보안장치", "건강관리", "레저용품", "원예도구", "자동차용품", "반려동물용품", "교육기자재", "음향장비", "컴퓨터부품", "스마트기기", "미용도구", "요리도구", "세탁용품", "정리용품", "안전장비", "측정기구", "수리도구"
- 피해야 할 예시: "의자", "컵", "펜" 등 단일 제품명
- 좋은 예시에서 제시하지 않았더라도 제품 분석 결과에 적합한 태그를 생성하세요.
- 태그 앞에 #을 붙여서 출력
- 다른 설명 없이 태그만 출력
- 태그는 최대 2개까지만 출력, 중복되지 않도록 주의하세요.

태그:`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user", 
            content: tagPrompt
          }
        ],
        max_tokens: 30,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`태그 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    let tag = data.choices[0].message.content.trim();
    
    // 불필요한 텍스트 제거
    tag = tag.replace(/^태그:\s*/, '').replace(/^\s*출력:\s*/, '').replace(/^\s*결과:\s*/, '');
    
    // 태그가 #으로 시작하지 않으면 추가
    const finalTag = tag.startsWith('#') ? tag : `#${tag}`;
    
    console.log('카테고리 분석 완료:', finalTag);
    return finalTag;
  } catch (error) {
    console.error('태그 생성 실패:', error);
    return '#오류';
  }
}

// Step 1-4 인사이트를 바탕으로 최종 개선된 아이디어 생성
export async function generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType) {
  try {
    console.log('개선된 제품 정보 생성 중...');
    
    const improvePrompt = `당신은 제품 디자인 전문가입니다.
Step 1-4의 분석과 인사이트를 바탕으로 최종 개선된 제품의 제목과 설명을 작성해주세요.

### 원본 제품 정보
제목: ${originalTitle}
설명: ${originalDescription}

### 분석 단계별 인사이트
${stepsData.map(step => `
Step ${step.stepNumber}: ${step.title}
${step.description}
${step.subSteps ? step.subSteps.map(sub => `- ${sub.title}: ${sub.description}`).join('\n') : ''}
`).join('\n')}

### 첨가제 타입
${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 개선

### 중요: 반드시 아래 JSON 형식으로만 응답하세요
{
  "title": "개선된 제품 제목",
  "description": "개선된 제품 설명"
}

### 작성 규칙
1. title: 원본 제목에서 완전히 새로운 제품명을 창조하세요. 단순히 "개선된 [원본명]"이 아닌, Step 4 인사이트를 반영한 혁신적인 새 제품명을 만드세요 (최대 30자)
2. description: Step 4의 인사이트를 중심으로 어떤 점이 개선되었는지 구체적으로 설명 (3-4문장)
3. JSON 외의 다른 텍스트는 절대 포함하지 마세요
4. 따옴표 안의 텍스트에서 줄바꿈은 사용하지 마세요
5. JSON 형식을 정확히 지켜주세요
6. title은 창의적이고 혁신적인 새 제품명이어야 합니다 (예: "스마트 접이식 독서 체어" → "FlexiRead 모듈러 체어")`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a product design expert. Always respond with valid JSON format only, without any additional text or formatting."
          },
          {
            role: "user",
            content: improvePrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`개선된 제품 정보 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content.trim();
    
    console.log('원본 응답:', responseText);
    
    // JSON 추출 및 정리
    responseText = responseText
      .replace(/^```json\s*/, '')
      .replace(/\s*```$/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
    
    // 혹시 텍스트가 JSON 앞뒤에 있다면 JSON 부분만 추출
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    console.log('정리된 JSON 텍스트:', responseText);

    try {
      const result = JSON.parse(responseText);
      
      // 결과 검증
      if (!result.title || !result.description) {
        throw new Error('필수 필드가 누락되었습니다');
      }
      
      // 텍스트 정리
      result.title = result.title.replace(/[\n\r]/g, ' ').trim();
      result.description = result.description.replace(/[\n\r]/g, ' ').trim();
      
      console.log('파싱 성공:', result);
      return result;
      
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('파싱 시도한 텍스트:', responseText);
      
      // 파싱 실패 시 텍스트에서 제목과 설명 추출 시도
      const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = responseText.match(/"description"\s*:\s*"([^"]+)"/);
      
      if (titleMatch && descMatch) {
        return {
          title: titleMatch[1].trim(),
          description: descMatch[1].trim()
        };
      }
      
      // 최종 실패 시 기본값 반환
      return {
        title: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 개선된 ${originalTitle}`,
        description: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 첨가제를 통해 개선된 제품입니다.`
      };
    }
  } catch (error) {
    console.error('개선된 제품 정보 생성 실패:', error);
    // 실패 시 기본값 반환
    return {
      title: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 개선된 ${originalTitle}`,
      description: `${additiveType === 'creativity' ? '창의성' : additiveType === 'aesthetics' ? '심미성' : '사용성'} 첨가제를 통해 개선된 제품입니다.`
    };
  }
}

// 한국어 제품 정보를 영어로 번역하여 DALL-E 프롬프트 생성
export async function generateEnglishPromptForDallE(title, description, stepsData, additiveType) {
  try {
    console.log('DALL-E 영어 프롬프트 생성 중...');
    
    const translatePrompt = `You are a professional product designer specializing in creating simple, clean DALL-E 3 prompts.

Create a concise English prompt for DALL-E 3 that will generate a single product image with these requirements:

### Product Information
Title: ${title}
Description: ${description}

### Enhancement Focus
${additiveType === 'creativity' ? 'Creative innovation and unique design features' : 
  additiveType === 'aesthetics' ? 'Beautiful visual design and premium materials' : 
  'User-friendly design and ergonomic features'}

### DALL-E 3 Prompt Requirements:
1. SINGLE PRODUCT ONLY - no multiple items, no background objects
2. NO TEXT or labels anywhere in the image
3. Clean light gray gradient background (not pure white)
4. Soft, diffused lighting that shows product details clearly
5. Low contrast, gentle shadows for premium feel
6. Professional product photography with even lighting
7. Materials should be clearly visible (textures, finishes)
8. Avoid harsh lighting or strong shadows
9. Natural color reproduction without over-saturation

Create a simple but specific English prompt (max 120 words) that describes:
- The exact product type with key features
- Materials and finishes
- Soft, even lighting style
- Gentle shadows and low contrast
- Product details and characteristics

Example format: "A single modern [product type] with [key features], [materials], soft diffused lighting, gentle shadows, low contrast, light gray gradient background, professional product photography, even illumination, natural colors"

Output only the English prompt:`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: translatePrompt
          }
        ],
        max_tokens: 180,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`영어 프롬프트 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    let englishPrompt = data.choices[0].message.content.trim();
    
    // 불필요한 따옴표나 설명 제거
    englishPrompt = englishPrompt.replace(/^["']/, '').replace(/["']$/, '');
    
    // 필수 키워드 강제 추가 (혹시 누락된 경우)
    const essentialKeywords = [
      "single product",
      "clean white background", 
      "no text",
      "professional product photography",
      "studio lighting"
    ];
    
    essentialKeywords.forEach(keyword => {
      if (!englishPrompt.toLowerCase().includes(keyword.toLowerCase().replace(/\s+/g, '\\s+'))) {
        if (keyword === "no text") {
          englishPrompt = `${englishPrompt}, no text or labels`;
        } else if (keyword === "single product") {
          englishPrompt = `A single ${englishPrompt.replace(/^A\s+/i, '')}`;
        } else {
          englishPrompt = `${englishPrompt}, ${keyword}`;
        }
      }
    });
    
    console.log('생성된 영어 프롬프트:', englishPrompt);
    return englishPrompt;
    
  } catch (error) {
    console.error('영어 프롬프트 생성 실패:', error);
    // 실패 시 단순한 기본 프롬프트 반환
    const fallbackPrompt = `A single modern ${title.replace(/개선된|향상된|새로운/g, '').trim()}, clean white background, professional product photography, studio lighting, no text, commercial style, premium materials`;
    return fallbackPrompt;
  }
}

// DALL-E 3로 제품 이미지 생성
export async function generateProductImageWithDallE(englishPrompt) {
  try {
    console.log('DALL-E 3 이미지 생성 시작...');
    console.log('사용할 프롬프트:', englishPrompt);
    
    // 프롬프트 최적화 - DALL-E 3를 위한 단순하고 명확한 지시
    const optimizedPrompt = `${englishPrompt}. Single product only, no text, no labels, clean white background, studio photography`.substring(0, 3900); // DALL-E 3 프롬프트 길이 제한
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: optimizedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd", // 고품질 이미지
        style: "natural" // 자연스러운 스타일
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ DALL-E 3 API 오류 상세:', errorData);
      console.error('❌ HTTP 상태:', response.status);
      console.error('❌ 에러 메시지:', errorData.error?.message || 'Unknown error');
      throw new Error(`DALL-E 3 API 오류: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('DALL-E 3 이미지 생성 완료');
    console.log('생성된 이미지 URL:', data.data[0].url);
    
    return data.data[0].url; // 생성된 이미지 URL 반환
    
  } catch (error) {
    console.error('❌ DALL-E 3 이미지 생성 완전 실패:', error);
    console.error('❌ 오류 타입:', error.name);
    console.error('❌ 오류 메시지:', error.message);
    console.error('❌ 사용된 프롬프트:', optimizedPrompt.substring(0, 200) + '...');
    throw error;
  }
}

// 통합 함수: 제품 정보로부터 DALL-E 이미지까지 한번에 생성
export async function generateImprovedProductWithImage(originalTitle, originalDescription, stepsData, additiveType) {
  let improvedInfo = null;
  let imageGenerationError = null;
  
  try {
    console.log('개선된 제품 정보 및 이미지 생성 프로세스 시작...');
    
    // 1. 개선된 제품 정보 생성
    improvedInfo = await generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType);
    console.log('✅ 개선된 제품 정보 생성 성공');
    
    try {
      // 2. 영어 프롬프트 생성
      console.log('🔄 DALL-E 영어 프롬프트 생성 중...');
      const englishPrompt = await generateEnglishPromptForDallE(improvedInfo.title, improvedInfo.description, stepsData, additiveType);
      console.log('✅ 영어 프롬프트 생성 성공');
      
      // 3. DALL-E 3로 이미지 생성
      console.log('🎨 DALL-E 3 이미지 생성 중...');
      const imageUrl = await generateProductImageWithDallE(englishPrompt);
      console.log('✅ DALL-E 3 이미지 생성 성공');
      
      return {
        ...improvedInfo,
        imageUrl,
        originalImagePrompt: englishPrompt,
        imageGenerationSuccess: true
      };
      
    } catch (imageError) {
      console.error('❌ DALL-E 이미지 생성 실패:', imageError);
      imageGenerationError = imageError;
      
      // 이미지 생성 실패 시 null로 명시적 표시 (원본 이미지 대체하지 않음)
      return {
        ...improvedInfo,
        imageUrl: null, // 명시적으로 null - 이미지 생성 실패
        originalImagePrompt: null,
        imageGenerationSuccess: false,
        imageGenerationError: imageError.message
      };
    }
    
  } catch (error) {
    console.error('❌ 통합 제품 생성 완전 실패:', error);
    
    // 제품 정보 생성도 실패한 경우
    if (!improvedInfo) {
      throw error; // 상위로 에러 전파
    }
    
    // 제품 정보는 성공했지만 이미지만 실패한 경우
    return {
      ...improvedInfo,
      imageUrl: null,
      originalImagePrompt: null,
      imageGenerationSuccess: false,
      imageGenerationError: error.message
    };
  }
}

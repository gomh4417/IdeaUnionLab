const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
const STABILITY_API_URL = "https://api.stability.ai/v2beta/stable-image/generate/sd3";

// 슬라이더 값을 Temperature로 변환
const getTemperatureFromSlider = (sliderValue) => {
  const temperatureMap = {
    0: 0.3,
    1: 0.7,
    2: 1.0
  };
  return temperatureMap[sliderValue] || 0.7;
};

// 방어적 JSON 파싱 함수
const parseJsonSafely = (responseText) => {
  // 1단계: 기본 정제
  let cleanedText = responseText.trim();
  
  // 코드블록 제거
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // 2단계: 첫 번째 {부터 올바른 괄호 매칭으로 닫히는 }까지 추출
  const firstBraceIndex = cleanedText.indexOf('{');
  if (firstBraceIndex === -1) {
    throw new Error('JSON 시작 지점을 찾을 수 없습니다');
  }
  
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = firstBraceIndex; i < cleanedText.length; i++) {
    if (cleanedText[i] === '{') {
      braceCount++;
    } else if (cleanedText[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  if (endIndex === -1) {
    throw new Error('JSON 끝 지점을 찾을 수 없습니다');
  }
  
  const jsonText = cleanedText.substring(firstBraceIndex, endIndex + 1);
  
  // 3단계: 1차 파싱 시도
  try {
    return JSON.parse(jsonText);
  } catch (parseError) {
    // 4단계: 일반적인 오류 수정 후 재시도
    let fixedJson = jsonText;
    
    // 후행 쉼표 제거
    fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // 마지막 } 누락 시 추가
    if (!fixedJson.trim().endsWith('}') && fixedJson.includes('"steps"')) {
      fixedJson = fixedJson.trim() + '}';
    }
    
    return JSON.parse(fixedJson);
  }
};

// 구조 검증 및 보정 함수
const validateAndFixStructure = (result, additiveType) => {
  // 기본 구조 검증
  if (!result.steps || !Array.isArray(result.steps)) {
    throw new Error('steps 배열이 없습니다');
  }
  
  // 4개 step 보장
  while (result.steps.length < 4) {
    const stepNumber = result.steps.length + 1;
    result.steps.push({
      stepNumber,
      title: `Step ${stepNumber} 분석`,
      description: `Step ${stepNumber}에 대한 분석 내용입니다.`
    });
  }
  
  // 각 step 검증 및 보정
  for (let i = 0; i < 4; i++) {
    const step = result.steps[i];
    
    // 기본 필드 보정
    if (!step.stepNumber) step.stepNumber = i + 1;
    if (!step.title) step.title = `Step ${i + 1} 분석이에요`;
    
    // Step 3 특별 처리
    if (step.stepNumber === 3) {
      if (additiveType === 'usability') {
        // 사용성: descriptions 배열 5개 보장
        if (!step.descriptions || !Array.isArray(step.descriptions) || step.descriptions.length !== 5) {
          step.descriptions = [
            "1단계: 사용자가 제품에 처음 접근할 때의 문제점이 있어요.",
            "2단계: 주요 기능 사용 과정에서 불편함이 있어요.",
            "3단계: 사용 중 발생하는 혼란이 있어요.",
            "4단계: 사용 후 정리나 보관 과정에 문제가 있어요.",
            "5단계: 전체적인 사용자 경험에 문제가 있어요."
          ];
        }
      } else {
        // 창의성, 심미성: subSteps 배열 3개 보장
        if (!step.subSteps || !Array.isArray(step.subSteps) || step.subSteps.length !== 3) {
          step.subSteps = [
            { title: "1차 분석: 기본 구조 문제", description: "기존 아이디어의 기본 구조나 형태에 문제가 있어요." },
            { title: "2차 분석: 기능 요소 문제", description: "새로운 기능이나 사용성에 문제가 있어요." },
            { title: "3차 분석: 통합 최적화 문제", description: "모든 요소의 통합과 최적화에 문제가 있어요." }
          ];
        }
      }
    } else {
      // Step 1, 2, 4: description 필수
      if (!step.description) {
        const typeNames = { creativity: '창의성', aesthetics: '심미성', usability: '사용성' };
        step.description = `${typeNames[additiveType] || '분석'} 관점에서 아이디어를 분석하고 개선 방향을 제시해요.`;
      }
    }
  }
  
  return result;
};

// Fallback 구조 생성 함수
const getFallbackStructure = (additiveType) => {
  const typeNames = { creativity: '창의성', aesthetics: '심미성', usability: '사용성' };
  const typeName = typeNames[additiveType] || '분석';
  
  return {
    steps: [
      {
        stepNumber: 1,
        title: "아이디어 분석 중 오류가 발생했어요",
        description: "AI 분석 중 일시적인 오류가 발생했어요. 다시 시도해주세요."
      },
      {
        stepNumber: 2,
        title: `${typeName} 첨가제를 적용할 예정이에요`,
        description: "첨가제 적용을 위한 분석이 진행돼요."
      },
      {
        stepNumber: 3,
        title: "적용 과정을 분석하고 있어요",
        ...(additiveType === 'usability' ? {
          descriptions: [
            "1단계: 기본 사용성 개선이 필요해요",
            "2단계: 인터페이스 최적화가 필요해요", 
            "3단계: 사용자 경험 향상이 필요해요",
            "4단계: 접근성 개선이 필요해요",
            "5단계: 전체 통합이 필요해요"
          ]
        } : {
          subSteps: [
            { title: "1차 분석: 기본 구조 문제", description: "기존 아이디어의 기본 구조나 형태에 문제가 있어요." },
            { title: "2차 분석: 기능 요소 문제", description: "새로운 기능이나 사용성에 문제가 있어요." },
            { title: "3차 분석: 통합 최적화 문제", description: "모든 요소의 통합과 최적화에 문제가 있어요." }
          ]
        })
      },
      {
        stepNumber: 4,
        title: "최종적으로 인사이트를 도출했어요!",
        description: "분석을 통해 발견된 개선 방향을 제시해요."
      }
    ]
  };
};

// 공통 프롬프트 (간소화)
const VISION_PROMPT = `당신은 제품 디자인 전문가입니다.
제공된 이미지를 분석하여 시각적 정보를 간결하게 설명하세요.

분석 기준:
1. 제품의 형태, 구조, 주요 구성 요소
2. 재질, 색상, 질감 등 시각적 특징
3. 기능적 요소와 사용성 특징
4. 눈에 띄는 문제점이나 특이사항

출력 조건:
- 최대 5줄 이내로 간결하게 작성
- 명확한 사실 위주로 작성
- 순수 텍스트만 출력 (JSON, 코드블록 금지)`;

// 창의성 첨가제 프롬프트 (간소화)
const ADDITIVE_PROMPTS = {
  creativity: (ideaTitle, ideaDescription, visionResult) => `역할: 당신은 제품 디자인 및 TRIZ 전문가입니다. 아래 스키마를 만족하는 JSON 객체만 반환하세요.

[입력]
- 아이디어
  - 제목: ${ideaTitle}
  - 설명: ${ideaDescription}
- 이미지 분석: ${visionResult.split('\n').slice(0, 5).join('\n')}

[스키마]
{
  "steps": [
    { "stepNumber": 1, "title": string, "description": string },
    { "stepNumber": 2, "title": string, "description": string },
    { "stepNumber": 3, "title": string, "subSteps": [
        { "title": string, "description": string },
        { "title": string, "description": string },
        { "title": string, "description": string }
      ]
    },
    { "stepNumber": 4, "title": string, "description": string }
  ]
}

[요구사항]
- Step1: title에 "${ideaTitle}은 OOO 문제점을 가지고 있었어요!" 형식으로 문제점 요약, description에 현재 아이디어의 핵심 특징과 한계점 분석 (4-5문장, ~해요/~이에요 말투)
- Step2: title에 "TRIZ 창의성 원리를 적용할 예정이에요", description에 적용할 TRIZ 원리 1-2개 선정과 이유 (3-4문장, ~해요/~이에요 말투)  
- Step3: title에 "TRIZ 원리 중 OOO 원리에 문제가 있었어요" 형식으로 문제 원리 요약, subSteps에 실제 TRIZ 원리 분석 과정 3단계 (각 subStep당 2-3문장, ~해요/~이에요 말투)
- Step4: title에 "최종적으로 인사이트를 도출했어요!", description에 Step1-3 종합한 인사이트와 향후 개선 방향 (4-5문장, ~해요/~이에요 말투)
- 모든 문장 끝 친근한 말투 사용, JSON 외 텍스트 절대 금지`,

// 심미성 첨가제 프롬프트 (간소화)
  aesthetics: (ideaTitle, ideaDescription, visionResult, referenceResult) => `역할: 당신은 제품 디자인 및 심미성 분석 전문가입니다. 아래 스키마를 만족하는 JSON 객체만 반환하세요.

[입력]
- 아이디어
  - 제목: ${ideaTitle}
  - 설명: ${ideaDescription}
- 이미지 분석: ${visionResult.split('\n').slice(0, 5).join('\n')}
- 레퍼런스 분석: ${referenceResult.split('\n').slice(0, 5).join('\n')}

[스키마]
{
  "steps": [
    { "stepNumber": 1, "title": string, "description": string },
    { "stepNumber": 2, "title": string, "description": string },
    { "stepNumber": 3, "title": string, "subSteps": [
        { "title": string, "description": string },
        { "title": string, "description": string },
        { "title": string, "description": string }
      ]
    },
    { "stepNumber": 4, "title": string, "description": string }
  ]
}

[요구사항]
- Step1: title에 "${ideaTitle}은 OOO 심미적 문제를 가지고 있었어요!" 형식으로 디자인 문제점 요약, description에 시각적 특징과 심미적 장단점 분석 (4-5문장, ~해요/~이에요 말투)
- Step2: title에 "스키마 기반 심미성 원리를 적용할 예정이에요", description에 레퍼런스 기반 심미성 개선 계획 (3-4문장, ~해요/~이에요 말투)
- Step3: title에 "스키마 원리 중 OOO 부분에 문제가 있었어요" 형식으로 심미적 문제 원리 요약, subSteps에 실제 심미성 분석 과정 3단계 (각 subStep당 2-3문장, ~해요/~이에요 말투)
- Step4: title에 "최종적으로 인사이트를 도출했어요!", description에 Step1-3 종합한 디자인 인사이트와 심미적 개선 방향 (4-5문장, ~해요/~이에요 말투)
- 모든 문장 끝 친근한 말투 사용, JSON 외 텍스트 절대 금지`,

// 사용성 첨가제 프롬프트 (간소화)
  usability: (ideaTitle, ideaDescription, visionResult) => `역할: 당신은 제품 디자인 및 사용성 분석 전문가입니다. 아래 스키마를 만족하는 JSON 객체만 반환하세요.

[입력]
- 아이디어
  - 제목: ${ideaTitle}
  - 설명: ${ideaDescription}
- 이미지 분석: ${visionResult.split('\n').slice(0, 5).join('\n')}

[스키마]
{
  "steps": [
    { "stepNumber": 1, "title": string, "description": string },
    { "stepNumber": 2, "title": string, "description": string },
    { "stepNumber": 3, "title": string, "descriptions": [string, string, string, string, string] },
    { "stepNumber": 4, "title": string, "description": string }
  ]
}

[요구사항]
- Step1: title에 "${ideaTitle}은 OOO 사용성 문제를 가지고 있었어요!" 형식으로 사용성 문제점 요약, description에 사용성 장점과 문제점 분석 (4-5문장, ~해요/~이에요 말투)
- Step2: title에 "Task Analysis 사용성 원리를 적용할 예정이에요", description에 과제 분석법 기반 문제점 식별 과정 (3-4문장, ~해요/~이에요 말투)
- Step3: title에 "Task Analysis 중 OOO 단계에 문제가 있었어요" 형식으로 사용성 문제 단계 요약, descriptions 배열에 5단계 사용자 행동별 문제 분석 (각 단계별 2-3문장, ~해요/~이에요 말투)
- Step4: title에 "최종적으로 인사이트를 도출했어요!", description에 Step1-3 종합한 사용성 인사이트와 UX 개선 방향 (4-5문장, ~해요/~이에요 말투)
- 모든 문장 끝 친근한 말투 사용, JSON 외 텍스트 절대 금지`
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
            max_tokens: 200,
            temperature: 0.2,
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

    // 슬라이더 값을 Temperature로 변환 (안정성을 위해 상한 제한)
    const rawTemperature = getTemperatureFromSlider(sliderValue);
    const temperature = Math.min(rawTemperature, 0.4); // 형식 안정성을 위해 0.4로 캡
    console.log('Temperature 설정:', temperature, '(원본:', rawTemperature, ')');

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
            content: "항상 유효한 JSON 객체만 반환하세요. 코드블록, 설명, 기타 텍스트는 절대 포함하지 마세요." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        max_tokens: 1800, 
        temperature: temperature,
        response_format: { type: "json_object" } // JSON 강제 반환
      }),
    });

    if (!response.ok) {
      throw new Error(`아이디어 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log('아이디어 생성 API 응답 완료');
    
    let responseText = data.choices[0].message.content.trim();
    console.log('원본 응답 길이:', responseText.length);
    
    // 방어적 JSON 파싱
    try {
      const result = parseJsonSafely(responseText);
      
      console.log('JSON 파싱 성공, 구조 검증 시작...');
      
      // 구조 검증 및 보정
      const validatedResult = validateAndFixStructure(result, additiveType);
      
      console.log('구조 검증 및 보정 완료');
      return validatedResult;
      
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      console.error('응답 앞부분 (200자):', responseText.substring(0, 200));
      console.error('응답 뒷부분 (200자):', responseText.substring(responseText.length - 200));
      
      // 디버깅을 위한 원본 응답 로그 저장 (개발 모드에서만)
      if (import.meta.env.DEV) {
        console.log('=== 파싱 실패 원본 응답 (디버깅용) ===');
        console.log(responseText);
        console.log('=== 파싱 실패 원본 응답 끝 ===');
      }
      
      // 최종 실패 시 기본 구조 반환
      return getFallbackStructure(additiveType);
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

// Vision 분석 결과와 제목, 내용을 바탕으로 제품 태그 생성
export async function generateProductTag(visionAnalysis, title = '', description = '') {
  try {
    console.log('제품 카테고리 분석 중...', { title, description, visionAnalysis });
    
    const tagPrompt = `당신은 제품 카테고리 분석 전문가입니다. 
주어진 정보를 종합적으로 분석하여 적절한 카테고리 태그를 생성하세요.

### 제품 정보
제목: ${title || '제목 없음'}
설명: ${description || '설명 없음'}

### 이미지 분석 결과
${visionAnalysis || '이미지 분석 없음'}

### 태그 생성 과정
1. 제목과 설명에서 제품의 주요 기능과 용도를 파악하세요
2. 이미지 분석 결과에서 시각적 특성을 고려하세요
3. 제품이 사용되는 장소나 상황을 추론하세요  
4. 제품의 크기, 형태적 특성을 반영하세요
5. 사용자층이나 전문성을 고려하세요

### 태그 생성 규칙
- 정확히 4-5글자의 한글 태그를 생성
- "용도+영역" 또는 "특성+분야" 조합으로 구성
- 좋은 예시: "가전제품", "주방제품", "사무도구", "운동기구", "의료장비", "전자기기", "생활가전", "인테리어", "조명기구", "건강관리", "자동차용품", "반려동물용품", "교육기자재", "음향장비", "컴퓨터부품", "스마트기기", "미용도구", "요리도구", "세탁용품", "정리용품", "안전장비", "측정기구", "수리도구", "가구류", "문구류", "게임기기", "운송기구", "청소용품", "장난감", "악기류"
- 피해야 할 예시: "의자", "컵", "펜" 등 단일 제품명
- 제품 정보에 적합한 태그를 생성하세요
- 태그 앞에 #을 붙여서 출력
- 다른 설명 없이 태그만 출력
- 태그는 1개만 출력

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
    tag = tag.replace(/^태그:\s*/, '').replace(/^\s*출력:\s*/, '').replace(/^\s*결과:\s*/, '').replace(/^[\d.]+\s*/, '');
    
    // 태그가 #으로 시작하지 않으면 추가
    const finalTag = tag.startsWith('#') ? tag : `#${tag}`;
    
    console.log('카테고리 분석 완료:', finalTag);
    return finalTag;
  } catch (error) {
    console.error('태그 생성 실패:', error);
    return '#전자제품';
  }
}

// Step 1-4 인사이트를 바탕으로 최종 개선된 아이디어 생성
export async function generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType) {
  try {
    console.log('개선된 제품 정보 생성 중...');
    
    const improvePrompt = `역할: 당신은 제품 디자인 전문가입니다. 분석 결과를 바탕으로 개선된 제품 정보를 JSON으로 반환하세요.

[원본 제품]
제목: ${originalTitle}
설명: ${originalDescription}

[분석 인사이트]
${stepsData.map(step => `Step ${step.stepNumber}: ${step.title}\n${step.description || ''}${step.subSteps ? '\n' + step.subSteps.map(sub => `- ${sub.title}`).join('\n') : ''}${step.descriptions ? '\n' + step.descriptions.join('\n') : ''}`).join('\n\n')}

[스키마]
{
  "title": "개선된 제품 제목",
  "description": "개선된 제품 설명"
}

[요구사항]
- title: Step 4 인사이트를 반영한 혁신적인 새 제품명 (최대 30자)
- description: 어떤 점이 개선되었는지 구체적 설명 (3-4문장)
- JSON 외 텍스트 절대 금지, 줄바꿈은 공백으로 대체`;

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
            content: "항상 유효한 JSON 객체만 반환하세요. 코드블록, 설명, 기타 텍스트는 절대 포함하지 마세요."
          },
          {
            role: "user",
            content: improvePrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`개선된 제품 정보 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content.trim();
    
    console.log('응답 길이:', responseText.length);
    
    try {
      const result = JSON.parse(responseText);
      
      // 결과 검증 및 정리
      if (!result.title || !result.description) {
        throw new Error('필수 필드가 누락되었습니다');
      }
      
      // 텍스트 정리 (줄바꿈 제거)
      result.title = result.title.replace(/[\n\r]/g, ' ').trim();
      result.description = result.description.replace(/[\n\r]/g, ' ').trim();
      
      console.log('파싱 및 검증 성공:', result);
      return result;
      
    } catch (parseError) {
      console.error('JSON 파싱 실패:', parseError);
      
      // 간단한 복구 시도
      const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = responseText.match(/"description"\s*:\s*"([^"]+)"/);
      
      if (titleMatch && descMatch) {
        return {
          title: titleMatch[1].trim(),
          description: descMatch[1].trim()
        };
      }
      
      // 최종 실패 시 기본값 반환
      const typeNames = { creativity: '창의성', aesthetics: '심미성', usability: '사용성' };
      return {
        title: `${typeNames[additiveType] || '개선된'} ${originalTitle}`,
        description: `${typeNames[additiveType] || '분석'} 첨가제를 통해 개선된 제품이에요.`
      };
    }
  } catch (error) {
    console.error('개선된 제품 정보 생성 실패:', error);
    // 실패 시 기본값 반환
    const typeNames = { creativity: '창의성', aesthetics: '심미성', usability: '사용성' };
    return {
      title: `${typeNames[additiveType] || '개선된'} ${originalTitle}`,
      description: `${typeNames[additiveType] || '분석'} 첨가제를 통해 개선된 제품이에요.`
    };
  }
}

// Stability AI용 프롬프트 생성 (한국어 -> 영어 번역 및 최적화)
export async function generateStabilityPrompt(title, description, visionResult, originalImageUrl = null) {
  try {
    console.log('Stability AI용 프롬프트 생성 중...');
    
    const translatePrompt = `You are a professional product designer specializing in creating optimized prompts for Stability AI image generation.

Create a detailed English prompt for Stability AI that will generate a high-quality product image based on:

### Product Information
Title: ${title}
Description: ${description}

### Vision Analysis Result
${visionResult || 'No vision analysis available'}

${originalImageUrl ? '### Reference Image Available\nA reference image will be provided to maintain visual consistency.' : ''}

### Stability AI Prompt Requirements:
1. Single product focus - no multiple items or distracting elements
2. Professional product photography style
3. Clean, minimal background (white or light gradient)
4. High-quality materials and finishes clearly visible
5. Proper lighting that shows all product details
6. Modern, clean aesthetic
7. Commercial/marketing ready appearance
8. Sharp focus and high resolution look

Create a detailed English prompt (max 150 words) that describes:
- The exact product type with key innovative features
- Materials, textures, and finishes
- Professional photography lighting and composition
- Clean background and presentation style
- Any unique design elements or improvements

Focus on creating a prompt that will produce a premium, commercial-quality product image suitable for marketing materials.

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
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stability 프롬프트 생성 API 오류: ${response.status}`);
    }

    const data = await response.json();
    let stabilityPrompt = data.choices[0].message.content.trim();
    
    // 불필요한 따옴표나 설명 제거
    stabilityPrompt = stabilityPrompt.replace(/^["']/, '').replace(/["']$/, '');
    
    // 필수 키워드 확인 및 추가
    if (!stabilityPrompt.toLowerCase().includes('professional')) {
      stabilityPrompt += ', professional product photography';
    }
    if (!stabilityPrompt.toLowerCase().includes('white background') && !stabilityPrompt.toLowerCase().includes('clean background')) {
      stabilityPrompt += ', clean white background';
    }
    
    console.log('생성된 Stability AI 프롬프트:', stabilityPrompt);
    return stabilityPrompt;
    
  } catch (error) {
    console.error('Stability 프롬프트 생성 실패:', error);
    // 실패 시 기본 프롬프트 반환
    const fallbackPrompt = `Professional product photography of ${title}, modern design, clean materials, white background, studio lighting, commercial quality, high resolution`;
    return fallbackPrompt;
  }
}

// Stability AI로 제품 이미지 생성
export async function generateProductImageWithStability(promptText, originalImageUrl = null) {
  try {
    console.log('Stability AI 이미지 생성 시작...');
    console.log('사용할 프롬프트:', promptText);
    
    if (!STABILITY_API_KEY) {
      throw new Error('Stability AI API 키가 설정되지 않았습니다.');
    }
    
    // FormData 생성
    const formData = new FormData();
    formData.append('prompt', promptText);
    formData.append('mode', 'text-to-image');
    formData.append('model', 'sd3.5-large'); // 최신 고품질 모델
    formData.append('aspect_ratio', '1:1');
    formData.append('output_format', 'png');
    
    // 참조 이미지가 있는 경우 추가
    if (originalImageUrl) {
      try {
        // 원본 이미지 URL에서 이미지 데이터 가져오기
        const imageResponse = await fetch(originalImageUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          formData.append('image', imageBlob, 'reference.png');
          formData.append('strength', '0.35'); // 참조 이미지 영향도 (0.1-1.0)
          console.log('참조 이미지 추가됨');
        }
      } catch (imageError) {
        console.warn('참조 이미지 로드 실패, 텍스트만으로 생성:', imageError.message);
      }
    }

    const response = await fetch(STABILITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STABILITY_API_KEY}`,
        "Accept": "image/*"
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Stability AI API 오류 상세:', errorText);
      console.error('❌ HTTP 상태:', response.status);
      throw new Error(`Stability AI API 오류: ${response.status} - ${errorText}`);
    }

    // 이미지 데이터를 Base64로 변환
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    console.log('✅ Stability AI 이미지 생성 완료');
    return dataUrl;
    
  } catch (error) {
    console.error('❌ Stability AI 이미지 생성 실패:', error);
    console.error('❌ 오류 타입:', error.name);
    console.error('❌ 오류 메시지:', error.message);
    console.error('❌ 사용된 프롬프트:', promptText.substring(0, 200) + '...');
    throw error;
  }
}

// 통합 함수: 제품 정보로부터 Stability AI 이미지까지 한번에 생성
export async function generateImprovedProductWithImage(originalTitle, originalDescription, stepsData, additiveType, visionResult = '', originalImageUrl = null) {
  let improvedInfo = null;
  
  try {
    console.log('개선된 제품 정보 및 이미지 생성 프로세스 시작...');
    
    // 1. 개선된 제품 정보 생성
    improvedInfo = await generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType);
    console.log('✅ 개선된 제품 정보 생성 성공');
    
    try {
      // 2. Stability AI용 프롬프트 생성
      console.log('🔄 Stability AI 프롬프트 생성 중...');
      const stabilityPrompt = await generateStabilityPrompt(
        improvedInfo.title, 
        improvedInfo.description, 
        visionResult, 
        originalImageUrl
      );
      console.log('✅ Stability AI 프롬프트 생성 성공');
      
      // 3. Stability AI로 이미지 생성
      console.log('🎨 Stability AI 이미지 생성 중...');
      const imageUrl = await generateProductImageWithStability(stabilityPrompt, originalImageUrl);
      console.log('✅ Stability AI 이미지 생성 성공');
      
      return {
        ...improvedInfo,
        imageUrl,
        originalImagePrompt: stabilityPrompt,
        imageGenerationSuccess: true
      };
      
    } catch (imageError) {
      console.error('❌ Stability AI 이미지 생성 실패:', imageError);
      
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

// IFL(랜덤 아이디어 생성) 함수
export const generateRandomIdea = async (userPrompt) => {
  if (!API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  try {
    const prompt = `당신은 창의적인 제품 디자인 전문가입니다. 
사용자가 입력한 키워드를 바탕으로 혁신적이고 실용적인 제품 아이디어를 생성해주세요.

키워드: ${userPrompt}

다음 JSON 형식으로 응답해주세요:
{
  "title": "제품 이름 (간결하고 창의적으로)",
  "description": "제품에 대한 상세한 설명 (기능, 사용법, 특징을 포함하여 3-4문장으로)",
  "imagePrompt": "Stability AI로 이미지를 생성하기 위한 영어 프롬프트 (상세하고 구체적으로)"
}

창의성과 실용성을 모두 고려하여 독창적인 아이디어를 제안해주세요.`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`GPT API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('GPT 응답에서 JSON을 찾을 수 없습니다.');
    }
    
    const ideaData = JSON.parse(jsonMatch[0]);
    
    return {
      title: ideaData.title || '새로운 아이디어',
      description: ideaData.description || '아이디어 설명',
      imagePrompt: ideaData.imagePrompt || `Creative ${userPrompt} product design`
    };
    
  } catch (error) {
    console.error('랜덤 아이디어 생성 실패:', error);
    throw error;
  }
};

// Stability AI 이미지 생성 함수 (IFL용)
export const generateImage = async (prompt) => {
  if (!STABILITY_API_KEY) {
    throw new Error('Stability AI API 키가 설정되지 않았습니다.');
  }

  try {
    console.log('Stability AI 이미지 생성 (IFL):', prompt);
    
    // FormData 생성
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('mode', 'text-to-image');
    formData.append('model', 'sd3.5-large');
    formData.append('aspect_ratio', '1:1');
    formData.append('output_format', 'png');

    const response = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability AI API 요청 실패: ${response.status} - ${errorText}`);
    }

    // 이미지 데이터를 Base64로 변환
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return `data:image/png;base64,${base64Image}`;
    
  } catch (error) {
    console.error('이미지 생성 실패:', error);
    throw error;
  }
};

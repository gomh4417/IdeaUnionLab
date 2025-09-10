const API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // 기존 키 유지 (fallback용)
const API_URL = "https://api.openai.com/v1/chat/completions";
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY; // 기존 키 유지 (fallback용)
const STABILITY_API_URL = "https://api.stability.ai/v2beta/stable-image/generate/sd3";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TEXT_MODEL = "gemini-2.0-pro";
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

// =============================================================================

// 1. Vision API 프롬프트 (이미지 분석용)
const VISION_ANALYSIS_PROMPT = `당신은 제품 디자인 전문가입니다.
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

// 2. Stability AI 이미지 생성 프롬프트 템플릿
const STABILITY_PROMPT_TEMPLATE = `You are a professional product designer specializing in creating optimized prompts for Stability AI image generation.

Create a detailed English prompt for Stability AI that will generate a high-quality product image based PRIMARILY on the product information below:

### PRIMARY PRODUCT INFORMATION (MOST IMPORTANT - BASE THE IMAGE ON THIS)
Title: {TITLE}
Description: {DESCRIPTION}

### Additional Context (Use only as supplementary reference)
{VISION_ANALYSIS}

{REFERENCE_IMAGE_INFO}

### Stability AI Prompt Requirements:
1. COMPLETE PRODUCT VISIBILITY - entire product must be fully visible within frame
2. Proper framing with adequate space around product (not cropped or cut off)
3. Single product focus - no multiple items or distracting elements
4. Professional product photography style with studio lighting
5. Clean white background or subtle gradient
6. High-quality materials and finishes clearly visible
7. Proper lighting that shows all product details without harsh shadows
8. Modern, clean aesthetic suitable for commercial use
9. Sharp focus and high resolution appearance
10. Full product view from optimal angle

Create a detailed English prompt (max 150 words) that describes:
- The EXACT product type mentioned in the title and description
- Key features and improvements described in the product description
- Materials, textures, and finishes appropriate for this specific product
- Professional photography setup with full product visibility
- Clean background and proper framing

CRITICAL INSTRUCTIONS:
1. Focus PRIMARILY on the product title and description - this is the main product to generate
2. Do NOT generate random products - stick to what's described in the title/description
3. Always include keywords like "full product view", "completely visible", "not cropped", "proper framing"
4. If the vision analysis mentions different objects, ignore them and focus on the title/description

Focus on creating a prompt that will produce the EXACT product described in the title and description, with complete visibility and premium quality.

Output only the English prompt:`;

// 3. 제품 정보 개선 프롬프트 템플릿
const PRODUCT_IMPROVEMENT_PROMPT_TEMPLATE = `역할: 당신은 제품 디자인 전문가입니다. 분석 결과를 바탕으로 개선된 제품 정보를 JSON으로 반환하세요.

[원본 제품]
제목: {ORIGINAL_TITLE}
설명: {ORIGINAL_DESCRIPTION}

[분석 인사이트]
{STEPS_DATA}

[스키마]
{
  "title": "개선된 제품 제목",
  "description": "개선된 제품 설명"
}

[요구사항]
- title: Step 4 인사이트를 반영한 혁신적인 새 제품명 (최대 30자)
- description: 어떤 점이 개선되었는지 구체적 설명 (3-4문장)
- JSON 외 텍스트 절대 금지, 줄바꿈은 공백으로 대체`;

// 4. 제품 타입 매핑 (한국어 -> 영어)
const PRODUCT_TYPE_MAPPING = {
  '의자': ['chair', 'seat', 'seating'],
  '벤치': ['bench', 'seating'],
  '테이블': ['table', 'desk'],
  '램프': ['lamp', 'light', 'lighting'],
  '선반': ['shelf', 'shelving', 'storage'],
  '스피커': ['speaker', 'audio'],
  '가방': ['bag', 'backpack', 'handbag'],
  '컵': ['cup', 'mug', 'glass'],
  '펜': ['pen', 'pencil', 'writing'],
  '시계': ['watch', 'clock', 'timepiece'],
  '화장품': ['cosmetic', 'beauty', 'skincare'],
  '크림': ['cream', 'lotion', 'moisturizer']
};

// 5. 제외할 제품 키워드 (잘못 생성될 수 있는 제품들)
const UNWANTED_PRODUCT_KEYWORDS = [
  'phone', 'iphone', 'smartphone', 'monitor', 'screen', 
  'display', 'computer', 'laptop', 'tablet', 'electronics'
];

// 6. 필수 이미지 생성 키워드 (제품이 잘리지 않도록)
const ESSENTIAL_IMAGE_KEYWORDS = [
  { keywords: ['full product view', 'completely visible', 'entire product'], replacement: 'full product view, completely visible' },
  { keywords: ['not cropped', 'not cut off', 'proper framing'], replacement: 'not cropped, proper framing' },
  { keywords: ['adequate space', 'spacing around'], replacement: 'adequate spacing around product' },
  { keywords: ['professional'], replacement: 'professional product photography' },
  { keywords: ['white background', 'clean background'], replacement: 'clean white background' },
  { keywords: ['studio lighting'], replacement: 'studio lighting' }
];

// =============================================================================
// GEMINI API 헬퍼 함수들
// =============================================================================

/**
 * Gemini API로 텍스트 생성 (JSON 강제)
 * @param {string} prompt - 프롬프트 텍스트
 * @param {Object} schema - JSON 스키마 (선택사항)
 * @param {number} temperature - 온도 (0.0-2.0)
 * @param {number} maxTokens - 최대 토큰 수
 * @returns {Promise<string>} 생성된 텍스트
 */
async function callGeminiTextAPI(prompt, schema = null, temperature = 0.7, maxTokens = 2048) {
  try {
    console.log('🔮 Gemini Text API 호출 시작');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 40
      }
    };

    // JSON 스키마가 있으면 JSON 응답 강제
    if (schema) {
      requestBody.generationConfig.responseMimeType = "application/json";
      // 간단한 스키마 문자열 추가 (Gemini는 복잡한 스키마를 지원하지 않으므로)
      prompt += "\n\n응답은 반드시 유효한 JSON 형식으로만 출력하세요. 다른 텍스트나 설명은 포함하지 마세요.";
      requestBody.contents[0].parts[0].text = prompt;
    }

    const response = await fetch(`${GEMINI_API_URL}/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Gemini API에서 유효한 응답을 받지 못했습니다.');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini Text API 응답 완료');
    
    return responseText;
    
  } catch (error) {
    console.error('❌ Gemini Text API 호출 실패:', error);
    throw error;
  }
}

/**
 * Gemini API로 이미지 분석
 * @param {string} imageUrl - 이미지 URL (base64 data URL)
 * @param {string} prompt - 분석 프롬프트
 * @returns {Promise<string>} 분석 결과
 */
async function callGeminiVisionAPI(imageUrl, prompt) {
  try {
    console.log('👁️ Gemini Vision API 호출 시작');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    // base64 이미지를 Gemini 형식으로 변환
    let imageData;
    if (imageUrl.startsWith('data:image/')) {
      const [header, base64Data] = imageUrl.split(',');
      const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
      imageData = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } else {
      throw new Error('지원되지 않는 이미지 형식입니다. base64 data URL을 사용해주세요.');
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          imageData
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      }
    };

    const response = await fetch(`${GEMINI_API_URL}/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini Vision API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Gemini Vision API에서 유효한 응답을 받지 못했습니다.');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('✅ Gemini Vision API 응답 완료');
    
    return responseText;
    
  } catch (error) {
    console.error('❌ Gemini Vision API 호출 실패:', error);
    throw error;
  }
}

/**
 * Gemini API로 이미지 생성 (Imagen 3)
 * @param {string} prompt - 이미지 생성 프롬프트
 * @returns {Promise<string>} 생성된 이미지의 base64 data URL
 */
async function callGeminiImageGenerationAPI(prompt) {
  try {
    console.log('🎨 Gemini Image Generation API 호출 시작');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    // Imagen 3 모델 사용
    const requestBody = {
      prompt: prompt,
      number_of_images: 1,
      aspect_ratio: "1:1", // 1024x1024 정사각형
      safety_filter_level: "block_only_high",
      person_generation: "allow_adult"
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini Image Generation API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.generated_images || !data.generated_images[0]) {
      throw new Error('Gemini에서 이미지를 생성하지 못했습니다.');
    }

    // base64 이미지 데이터를 data URL로 변환
    const base64Image = data.generated_images[0].image.data;
    const dataUrl = `data:image/png;base64,${base64Image}`;
    
    console.log('✅ Gemini Image Generation API 응답 완료');
    return dataUrl;
    
  } catch (error) {
    console.error('❌ Gemini Image Generation API 호출 실패:', error);
    throw error;
  }
}

// =============================================================================

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
  } catch {
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

// =============================================================================
// 첨가제별 프롬프트 템플릿 (간소화)
// =============================================================================
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

// =============================================================================
// API 함수 1: Vision API - 이미지 분석 (Gemini로 교체)
// =============================================================================
export async function analyzeImageWithVision(imageUrl) {
    try {
        console.log('🔍 Gemini Vision API 호출 시작:', imageUrl.substring(0, 50) + '...');
        
        // Gemini Vision API 사용
        const analysisResult = await callGeminiVisionAPI(imageUrl, VISION_ANALYSIS_PROMPT);
        
        console.log('✅ Gemini Vision API 응답 완료');
        console.log('📄 Vision 분석 결과:', analysisResult.substring(0, 100) + '...');
        return analysisResult;
        
    } catch (error) {
        console.error('❌ Gemini Vision API 호출 실패:', error);
        
        // Fallback: OpenAI GPT-4V 사용
        try {
            console.log('🔄 Fallback: OpenAI GPT-4V 사용');
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
                            content: VISION_ANALYSIS_PROMPT
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
                throw new Error(`OpenAI Vision API 오류: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Fallback OpenAI Vision API 응답 완료');
            return data.choices[0].message.content;
            
        } catch (fallbackError) {
            console.error('❌ Fallback Vision API도 실패:', fallbackError);
            throw error; // 원본 에러 던지기
        }
    }
}

// 아이디어 분석 (텍스트 처리) - Gemini로 교체
export async function generateIdeaWithAdditive(additiveType, ideaTitle, ideaDescription, visionResult, referenceResult = null, sliderValue = 1) {
    try {
        console.log('🔮 Gemini 아이디어 생성 API 호출 시작:', additiveType, '슬라이더 값:', sliderValue);
        
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

        try {
            // Gemini API 사용 (JSON 강제)
            const responseText = await callGeminiTextAPI(prompt, true, temperature, 1800);
            
            console.log('원본 응답 길이:', responseText.length);
            
            // 방어적 JSON 파싱
            const result = parseJsonSafely(responseText);
            
            console.log('JSON 파싱 성공, 구조 검증 시작...');
            
            // 구조 검증 및 보정
            const validatedResult = validateAndFixStructure(result, additiveType);
            
            console.log('구조 검증 및 보정 완료');
            return validatedResult;
            
        } catch (geminiError) {
            console.error('Gemini API 실패, OpenAI로 Fallback:', geminiError);
            
            // Fallback: OpenAI 사용
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
                    response_format: { type: "json_object" }
                }),
            });

            if (!response.ok) {
                throw new Error(`Fallback OpenAI API 오류: ${response.status}`);
            }

            const data = await response.json();
            const responseText = data.choices[0].message.content.trim();
            
            try {
                const result = parseJsonSafely(responseText);
                const validatedResult = validateAndFixStructure(result, additiveType);
                console.log('✅ Fallback OpenAI로 성공');
                return validatedResult;
            } catch (parseError) {
                console.error('JSON 파싱 실패:', parseError);
                return getFallbackStructure(additiveType);
            }
        }
        
    } catch (error) {
        console.error('아이디어 생성 API 호출 실패:', error);
        
        // 최종 실패 시 기본 구조 반환
        return getFallbackStructure(additiveType);
    }
}

// 레퍼런스 이미지 분석 (심미성 첨가제용 vision API) - Gemini로 교체
export async function analyzeReferenceImage(imageUrl) {
  try {
    console.log('🔍 Gemini 레퍼런스 이미지 분석 시작:', imageUrl.substring(0, 50) + '...');
    
    const prompt = "당신은 디자인 전문가입니다. 제공된 레퍼런스 이미지의 심미적 특징을 분석하세요. 이 레퍼런스 이미지의 디자인 형태, 색상, 재질, 스타일적 특징을 간결하게 설명해 주세요.";
    
    try {
      // Gemini Vision API 사용
      const analysisResult = await callGeminiVisionAPI(imageUrl, prompt);
      console.log('✅ Gemini 레퍼런스 이미지 분석 완료');
      return analysisResult;
      
    } catch (geminiError) {
      console.error('Gemini 레퍼런스 분석 실패, OpenAI로 Fallback:', geminiError);
      
      // Fallback: OpenAI 사용
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
        throw new Error(`Fallback 레퍼런스 이미지 분석 API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Fallback 레퍼런스 이미지 분석 완료');
      return data.choices[0].message.content;
    }
    
  } catch (error) {
    console.error('레퍼런스 이미지 분석 실패:', error);
    throw error;
  }
}

// Vision 분석 결과와 제목, 내용을 바탕으로 제품 태그 생성 - Gemini로 교체
export async function generateProductTag(visionAnalysis, title = '', description = '') {
  try {
    console.log('🏷️ Gemini 제품 카테고리 분석 중...', { title, description, visionAnalysis });
    
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

    try {
      // Gemini API 사용
      const response = await callGeminiTextAPI(tagPrompt, false, 0.2, 30);
      let tag = response.trim();
      
      // 불필요한 텍스트 제거
      tag = tag.replace(/^태그:\s*/, '').replace(/^\s*출력:\s*/, '').replace(/^\s*결과:\s*/, '').replace(/^[\d.]+\s*/, '');
      
      // 태그가 #으로 시작하지 않으면 추가
      const finalTag = tag.startsWith('#') ? tag : `#${tag}`;
      
      console.log('✅ Gemini 카테고리 분석 완료:', finalTag);
      return finalTag;
      
    } catch (geminiError) {
      console.error('Gemini 태그 생성 실패, OpenAI로 Fallback:', geminiError);
      
      // Fallback: OpenAI 사용
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
        throw new Error(`Fallback 태그 생성 API 오류: ${response.status}`);
      }

      const data = await response.json();
      let tag = data.choices[0].message.content.trim();
      
      // 불필요한 텍스트 제거
      tag = tag.replace(/^태그:\s*/, '').replace(/^\s*출력:\s*/, '').replace(/^\s*결과:\s*/, '').replace(/^[\d.]+\s*/, '');
      
      // 태그가 #으로 시작하지 않으면 추가
      const finalTag = tag.startsWith('#') ? tag : `#${tag}`;
      
      console.log('✅ Fallback 카테고리 분석 완료:', finalTag);
      return finalTag;
    }
    
  } catch (error) {
    console.error('태그 생성 실패:', error);
    return '#전자제품';
  }
}

// Step 1-4 인사이트를 바탕으로 최종 개선된 아이디어 생성 - Gemini로 교체
export async function generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType) {
  try {
    console.log('🔮 Gemini 개선된 제품 정보 생성 중...');
    
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

    try {
      // Gemini API 사용 (JSON 강제)
      const responseText = await callGeminiTextAPI(improvePrompt, true, 0.2, 400);
      
      console.log('응답 길이:', responseText.length);
      
      const result = JSON.parse(responseText);
      
      // 결과 검증 및 정리
      if (!result.title || !result.description) {
        throw new Error('필수 필드가 누락되었습니다');
      }
      
      // 텍스트 정리 (줄바꿈 제거)
      result.title = result.title.replace(/[\n\r]/g, ' ').trim();
      result.description = result.description.replace(/[\n\r]/g, ' ').trim();
      
      console.log('✅ Gemini 파싱 및 검증 성공:', result);
      return result;
      
    } catch (geminiError) {
      console.error('Gemini 제품 정보 생성 실패, OpenAI로 Fallback:', geminiError);
      
      // Fallback: OpenAI 사용
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
        throw new Error(`Fallback 개선된 제품 정보 생성 API 오류: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.choices[0].message.content.trim();
      
      try {
        const result = JSON.parse(responseText);
        
        // 결과 검증 및 정리
        if (!result.title || !result.description) {
          throw new Error('필수 필드가 누락되었습니다');
        }
        
        // 텍스트 정리 (줄바꿈 제거)
        result.title = result.title.replace(/[\n\r]/g, ' ').trim();
        result.description = result.description.replace(/[\n\r]/g, ' ').trim();
        
        console.log('✅ Fallback 파싱 및 검증 성공:', result);
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

// 제품 타입 검증 및 보정 함수
const validateAndFixProductType = (stabilityPrompt, title, description) => {
  // 잘못된 제품이 언급되었는지 확인
  const hasUnwantedItems = UNWANTED_PRODUCT_KEYWORDS.some(item => 
    stabilityPrompt.toLowerCase().includes(item.toLowerCase())
  );
  
  // 원본 제품 타입 찾기
  let correctProductType = 'product';
  for (const [korean, englishTerms] of Object.entries(PRODUCT_TYPE_MAPPING)) {
    if (title.includes(korean) || description.includes(korean)) {
      correctProductType = englishTerms[0]; // 첫 번째 영어 용어 사용
      break;
    }
  }
  
  // 잘못된 아이템이 감지되면 프롬프트 재구성
  if (hasUnwantedItems) {
    console.warn('잘못된 제품 타입 감지, 프롬프트 재구성 중...');
    return `Full product view of ${correctProductType} based on "${title}", ${description.substring(0, 50)}..., completely visible, not cropped, proper framing, professional product photography, clean white background, studio lighting`;
  }
  
  return stabilityPrompt;
};

// 필수 키워드 추가 함수
const addEssentialKeywords = (stabilityPrompt) => {
  ESSENTIAL_IMAGE_KEYWORDS.forEach(({ keywords, replacement }) => {
    const hasKeyword = keywords.some(keyword => 
      stabilityPrompt.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      stabilityPrompt += `, ${replacement}`;
    }
  });
  
  // 최종 안전장치: 제품이 잘리지 않도록 하는 강제 키워드 추가
  if (!stabilityPrompt.toLowerCase().includes('full') && !stabilityPrompt.toLowerCase().includes('complete')) {
    stabilityPrompt = `Full product view, ${stabilityPrompt}`;
  }
  
  return stabilityPrompt;
};

// =============================================================================
// API 함수 2: 이미지 생성 프롬프트 최적화 (Gemini로 교체)
// =============================================================================
export async function generateStabilityPrompt(title, description, visionResult, originalImageUrl = null) {
  try {
    console.log('🎨 Gemini 이미지 생성 프롬프트 최적화 중...');
    console.log('📝 입력 데이터:');
    console.log('- 제품 제목:', title);
    console.log('- 제품 설명:', description.substring(0, 100) + '...');
    console.log('- Vision 분석 유무:', !!visionResult);
    
    // 프롬프트 템플릿을 실제 데이터로 치환
    const translatePrompt = STABILITY_PROMPT_TEMPLATE
      .replace('{TITLE}', title)
      .replace('{DESCRIPTION}', description)
      .replace('{VISION_ANALYSIS}', visionResult ? `Vision Analysis: ${visionResult}` : 'No additional vision analysis available')
      .replace('{REFERENCE_IMAGE_INFO}', originalImageUrl ? '### Reference Image Available\nA reference image will be provided to maintain visual consistency with the original idea.' : '');

    console.log('📤 Gemini로 전송할 프롬프트 길이:', translatePrompt.length);

    try {
      // Gemini API 사용
      const response = await callGeminiTextAPI(translatePrompt, false, 0.3, 200);
      let stabilityPrompt = response.trim();
      
      // 불필요한 따옴표나 설명 제거
      stabilityPrompt = stabilityPrompt.replace(/^["']/, '').replace(/["']$/, '');
      
      console.log('🔍 원본 프롬프트 검증 중...');
      console.log('📄 생성된 프롬프트:', stabilityPrompt.substring(0, 150) + '...');
      
      // 제품 타입 검증 및 보정
      stabilityPrompt = validateAndFixProductType(stabilityPrompt, title, description);
      
      // 필수 키워드 추가
      stabilityPrompt = addEssentialKeywords(stabilityPrompt);
      
      console.log('✅ 최종 Gemini 프롬프트:', stabilityPrompt);
      return stabilityPrompt;
      
    } catch (geminiError) {
      console.error('Gemini 프롬프트 생성 실패, OpenAI로 Fallback:', geminiError);
      
      // Fallback: OpenAI 사용
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
        throw new Error(`Fallback Stability 프롬프트 생성 API 오류: ${response.status}`);
      }

      const data = await response.json();
      let stabilityPrompt = data.choices[0].message.content.trim();
      
      // 불필요한 따옴표나 설명 제거
      stabilityPrompt = stabilityPrompt.replace(/^["']/, '').replace(/["']$/, '');
      
      console.log('🔍 Fallback 프롬프트 검증 중...');
      console.log('📄 생성된 프롬프트:', stabilityPrompt.substring(0, 150) + '...');
      
      // 제품 타입 검증 및 보정
      stabilityPrompt = validateAndFixProductType(stabilityPrompt, title, description);
      
      // 필수 키워드 추가
      stabilityPrompt = addEssentialKeywords(stabilityPrompt);
      
      console.log('✅ 최종 Fallback 프롬프트:', stabilityPrompt);
      return stabilityPrompt;
    }
    
  } catch (error) {
    console.error('프롬프트 생성 실패:', error);
    // 실패 시 기본 프롬프트 반환 (원본 제품 정보 기반)
    const productType = title.toLowerCase().includes('의자') ? 'chair' : 
                       title.toLowerCase().includes('벤치') ? 'bench' :
                       title.toLowerCase().includes('테이블') ? 'table' :
                       title.toLowerCase().includes('램프') ? 'lamp' :
                       title.toLowerCase().includes('선반') ? 'shelf' :
                       'product';
    
    const fallbackPrompt = `Full product view of ${productType} based on "${title}", completely visible, not cropped, proper framing, adequate spacing around product, professional product photography, modern design, clean materials, clean white background, studio lighting, commercial quality, high resolution`;
    console.log('Fallback 프롬프트 사용:', fallbackPrompt);
    return fallbackPrompt;
  }
}

// Gemini Imagen으로 제품 이미지 생성 (Stability AI 대체)
export async function generateProductImageWithStability(promptText, originalImageUrl = null) {
  try {
    console.log('🎨 Gemini Imagen 이미지 생성 시작...');
    console.log('사용할 프롬프트:', promptText);
    
    try {
      // Gemini Imagen API 사용
      const imageUrl = await callGeminiImageGenerationAPI(promptText);
      console.log('✅ Gemini Imagen 이미지 생성 완료');
      return imageUrl;
      
    } catch (geminiError) {
      console.error('Gemini Imagen 실패, Stability AI로 Fallback:', geminiError);
      
      // Fallback: Stability AI 사용
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
        console.error('❌ Fallback Stability AI API 오류 상세:', errorText);
        console.error('❌ HTTP 상태:', response.status);
        throw new Error(`Fallback Stability AI API 오류: ${response.status} - ${errorText}`);
      }

      // 이미지 데이터를 Base64로 변환
      const imageBuffer = await response.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const dataUrl = `data:image/png;base64,${base64Image}`;
      
      console.log('✅ Fallback Stability AI 이미지 생성 완료');
      return dataUrl;
    }
    
  } catch (error) {
    console.error('❌ 이미지 생성 실패:', error);
    console.error('❌ 오류 타입:', error.name);
    console.error('❌ 오류 메시지:', error.message);
    console.error('❌ 사용된 프롬프트:', promptText.substring(0, 200) + '...');
    throw error;
  }
}

// 통합 함수: 제품 정보로부터 Stability AI 이미지까지 한번에 생성
export async function generateImprovedProductWithImage(originalTitle, originalDescription, stepsData, additiveType, visionResult = '', originalImageUrl = null) {
  let improvedInfo = null;
  
  // 디버깅 로그 추가
  console.log('🔍 통합 함수 호출 - 입력 파라미터:');
  console.log('- 원본 제목:', originalTitle);
  console.log('- 원본 설명:', originalDescription.substring(0, 100) + '...');
  console.log('- 첨가제 타입:', additiveType);
  console.log('- Vision 결과 있음:', !!visionResult);
  console.log('- 원본 이미지 URL 있음:', !!originalImageUrl);
  
  try {
    console.log('개선된 제품 정보 및 이미지 생성 프로세스 시작...');
    
    // 1. 개선된 제품 정보 생성
    improvedInfo = await generateImprovedProductInfo(originalTitle, originalDescription, stepsData, additiveType);
    console.log('✅ 개선된 제품 정보 생성 성공');
    
    try {
      // 2. Stability AI용 프롬프트 생성
      console.log('🔄 Stability AI 프롬프트 생성 중...');
      console.log('📝 프롬프트 생성용 데이터:');
      console.log('- 개선된 제목:', improvedInfo.title);
      console.log('- 개선된 설명:', improvedInfo.description.substring(0, 100) + '...');
      console.log('- Vision 결과:', visionResult ? visionResult.substring(0, 100) + '...' : 'None');
      
      const stabilityPrompt = await generateStabilityPrompt(
        improvedInfo.title, 
        improvedInfo.description, 
        visionResult, 
        originalImageUrl
      );
      console.log('✅ Stability AI 프롬프트 생성 성공');
      console.log('🎯 최종 생성된 프롬프트:', stabilityPrompt);
      
      // 3. Stability AI로 이미지 생성 (원본 이미지가 있으면 img2img 사용)
      console.log('🎨 Stability AI 이미지 생성 중...');
      let imageUrl;
      
      if (originalImageUrl && originalImageUrl.startsWith('data:image/')) {
        // img2img 사용 (원본 이미지가 data URL인 경우)
        console.log('🔄 IMG2IMG 모드 사용 - 원본 이미지 기반 개선');
        imageUrl = await generateProductImageWithStability_I2I(stabilityPrompt, originalImageUrl, 0.7);
      } else if (originalImageUrl && (originalImageUrl.startsWith('http://') || originalImageUrl.startsWith('https://'))) {
        // Firebase Storage URL을 data URL로 변환 후 img2img 사용
        console.log('🔄 IMG2IMG 모드 사용 - Firebase URL을 data URL로 변환 후 처리');
        try {
          const response = await fetch(originalImageUrl);
          const blob = await response.blob();
          const dataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          imageUrl = await generateProductImageWithStability_I2I(stabilityPrompt, dataUrl, 0.7);
        } catch (fetchError) {
          console.warn('Firebase URL 변환 실패, text-to-image로 대체:', fetchError);
          imageUrl = await generateProductImageWithStability(stabilityPrompt);
        }
      } else {
        // 일반 text-to-image 사용
        console.log('🔄 TEXT-TO-IMAGE 모드 사용');
        imageUrl = await generateProductImageWithStability(stabilityPrompt);
      }
      
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

// IFL(랜덤 아이디어 생성) 함수 - Gemini로 교체
export const generateRandomIdea = async (userPrompt) => {
  try {
    console.log('🔮 Gemini 랜덤 아이디어 생성 시작:', userPrompt);
    
    const prompt = `당신은 창의적인 제품 디자인 전문가입니다. 
사용자가 입력한 키워드를 바탕으로 혁신적이고 실용적인 제품 아이디어를 생성해주세요.

키워드: ${userPrompt}

다음 JSON 형식으로 응답해주세요:
{
  "title": "제품 이름 (간결하고 창의적인 한글로)",
  "description": "제품에 대한 상세한 설명 (기능, 사용법, 특징을 포함하여 3-4문장으로, 한글로)",
  "imagePrompt": "이미지 생성을 위한 영어 프롬프트 (제품이 잘리지 않도록 'full product view, completely visible, not cropped, proper framing' 등의 키워드 포함)"
}

중요한 요구사항:
- title과 description은 반드시 한글로 작성하세요
- 제품명은 한국인이 이해하기 쉬운 한글 이름으로 지어주세요
- 설명도 모두 한글로 작성하고, 친근하고 이해하기 쉽게 써주세요
- imagePrompt만 영어로 작성하세요
- 실제로 존재할 법한 현실적이고 유용한 제품을 제안하세요

imagePrompt 작성 시 반드시 다음을 포함하세요:
- Full product view, completely visible
- Not cropped, proper framing
- Professional product photography
- Clean white background
- Studio lighting

창의성과 실용성을 모두 고려하여 독창적인 아이디어를 제안해주세요.`;

    try {
      // Gemini API 사용 (JSON 강제)
      const responseText = await callGeminiTextAPI(prompt, true, 0.8, 500);
      
      // JSON 파싱
      const ideaData = JSON.parse(responseText);
      
      console.log('✅ Gemini 랜덤 아이디어 생성 완료');
      return {
        title: ideaData.title || '새로운 아이디어',
        description: ideaData.description || '혁신적인 제품 아이디어입니다.',
        imagePrompt: ideaData.imagePrompt || `Creative ${userPrompt} product design, full product view, completely visible, not cropped, proper framing, professional product photography, clean white background, studio lighting`
      };
      
    } catch (geminiError) {
      console.error('Gemini 랜덤 아이디어 생성 실패, OpenAI로 Fallback:', geminiError);
      
      // Fallback: OpenAI 사용
      if (!API_KEY) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다.');
      }

      const fallbackPrompt = `당신은 창의적인 제품 디자인 전문가입니다. 
사용자가 입력한 키워드를 바탕으로 혁신적이고 실용적인 제품 아이디어를 생성해주세요.

키워드: ${userPrompt}

다음 JSON 형식으로 응답해주세요:
{
  "title": "제품 이름 (간결하고 창의적인 한글로)",
  "description": "제품에 대한 상세한 설명 (기능, 사용법, 특징을 포함하여 3-4문장으로, 한글로)",
  "imagePrompt": "이미지 생성을 위한 영어 프롬프트 (제품이 잘리지 않도록 'full product view, completely visible, not cropped, proper framing' 등의 키워드 포함)"
}

중요한 요구사항:
- title과 description은 반드시 한글로 작성하세요
- 제품명은 한국인이 이해하기 쉬운 한글 이름으로 지어주세요
- 설명도 모두 한글로 작성하고, 친근하고 이해하기 쉽게 써주세요
- imagePrompt만 영어로 작성하세요
- 실제로 존재할 법한 현실적이고 유용한 제품을 제안하세요

창의성과 실용성을 모두 고려하여 독창적인 아이디어를 제안해주세요.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: fallbackPrompt }],
          temperature: 0.8,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Fallback GPT API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // JSON 파싱
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('GPT 응답에서 JSON을 찾을 수 없습니다.');
      }
      
      const ideaData = JSON.parse(jsonMatch[0]);
      
      console.log('✅ Fallback 랜덤 아이디어 생성 완료');
      return {
        title: ideaData.title || '새로운 아이디어',
        description: ideaData.description || '혁신적인 제품 아이디어입니다.',
        imagePrompt: ideaData.imagePrompt || `Creative ${userPrompt} product design, full product view, completely visible, not cropped, proper framing, professional product photography, clean white background, studio lighting`
      };
    }
    
  } catch (error) {
    console.error('랜덤 아이디어 생성 실패:', error);
    throw error;
  }
};

// Gemini Imagen 이미지 생성 함수 (IFL용)
export const generateImage = async (prompt) => {
  try {
    console.log('🎨 Gemini Imagen 이미지 생성 (IFL):', prompt);
    
    // 잘못된 제품 키워드 감지
    const unwantedItems = ['phone', 'iphone', 'smartphone', 'monitor', 'screen', 'display', 'computer', 'laptop', 'tablet'];
    const hasUnwantedItems = unwantedItems.some(item => 
      prompt.toLowerCase().includes(item.toLowerCase())
    );
    
    // 프롬프트 개선: 제품이 잘리지 않도록 키워드 추가
    let enhancedPrompt = prompt;
    
    if (hasUnwantedItems) {
      console.warn('IFL: 잘못된 제품 키워드 감지, 일반적인 제품으로 대체');
      enhancedPrompt = prompt.replace(/\b(phone|iphone|smartphone|monitor|screen|display|computer|laptop|tablet)\b/gi, 'product');
    }
    
    if (!enhancedPrompt.toLowerCase().includes('full') && !enhancedPrompt.toLowerCase().includes('complete')) {
      enhancedPrompt = `Full product view, completely visible, ${enhancedPrompt}, not cropped, proper framing, adequate spacing around product`;
    }
    
    try {
      // Gemini Imagen API 사용
      const imageUrl = await callGeminiImageGenerationAPI(enhancedPrompt);
      console.log('✅ Gemini Imagen 이미지 생성 (IFL) 완료');
      return imageUrl;
      
    } catch (geminiError) {
      console.error('Gemini Imagen 실패, Stability AI로 Fallback:', geminiError);
      
      // Fallback: Stability AI 사용
      if (!STABILITY_API_KEY) {
        throw new Error('Stability AI API 키가 설정되지 않았습니다.');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);
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
        throw new Error(`Fallback Stability AI API 요청 실패: ${response.status} - ${errorText}`);
      }

      // 이미지 데이터를 Base64로 변환
      const imageBuffer = await response.arrayBuffer();
      const base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      console.log('✅ Fallback Stability AI 이미지 생성 (IFL) 완료');
      return `data:image/png;base64,${base64Image}`;
    }
    
  } catch (error) {
    console.error('이미지 생성 실패:', error);
    throw error;
  }
};

// =============================================================================
// IMG2IMG 기능 (새로운 기능)
// =============================================================================

/**
 * Stability AI를 사용한 Image-to-Image 생성
 * @param {string} prompt - 이미지 생성을 위한 프롬프트
 * @param {string} imageUrl - 입력 이미지 URL (base64 data URL 형태)
 * @param {number} strength - 이미지 변형 강도 (0.0-1.0, 기본값: 0.7)
 * @returns {Promise<string>} 생성된 이미지의 base64 data URL
 */
export const generateProductImageWithStability_I2I = async (prompt, imageUrl, strength = 0.7) => {
  try {
    console.log('IFL: Stability AI img2img 생성 시작');
    console.log('IFL: 프롬프트:', prompt.substring(0, 100) + '...');
    console.log('IFL: 입력 이미지 길이:', imageUrl?.length || 0);
    console.log('IFL: 변형 강도:', strength);

    if (!STABILITY_API_KEY) {
      throw new Error('Stability AI API 키가 설정되지 않았습니다');
    }

    if (!imageUrl || !imageUrl.startsWith('data:image/')) {
      throw new Error('유효한 이미지 데이터가 필요합니다');
    }

    // Base64 이미지 데이터를 Blob으로 변환
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 잘못된 제품 키워드 감지 및 프롬프트 개선
    const unwantedItems = ['phone', 'iphone', 'smartphone', 'monitor', 'screen', 'display', 'computer', 'laptop', 'tablet'];
    const hasUnwantedItems = unwantedItems.some(item => 
      prompt.toLowerCase().includes(item.toLowerCase())
    );
    
    let enhancedPrompt = prompt;
    
    if (hasUnwantedItems) {
      console.warn('IFL: 잘못된 제품 키워드 감지, 일반적인 제품으로 대체');
      enhancedPrompt = prompt.replace(/\b(phone|iphone|smartphone|monitor|screen|display|computer|laptop|tablet)\b/gi, 'product');
    }
    
    if (!enhancedPrompt.toLowerCase().includes('full') && !enhancedPrompt.toLowerCase().includes('complete')) {
      enhancedPrompt = `Full product view, completely visible, ${enhancedPrompt}, not cropped, proper framing, adequate spacing around product`;
    }

    // FormData 생성 (img2img용)
    const formData = new FormData();
    formData.append('prompt', enhancedPrompt);
    formData.append('mode', 'image-to-image');
    formData.append('model', 'sd3.5-large');
    formData.append('image', blob, 'input.png');
    formData.append('strength', strength.toString());
    formData.append('output_format', 'png');

    const apiResponse = await fetch(STABILITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'image/*'
      },
      body: formData
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Stability AI img2img API 요청 실패: ${apiResponse.status} - ${errorText}`);
    }

    // 이미지 데이터를 Base64로 변환
    const imageBuffer = await apiResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const resultImage = `data:image/png;base64,${base64Image}`;
    console.log('IFL: img2img 생성 완료');
    
    return resultImage;
    
  } catch (error) {
    console.error('img2img 이미지 생성 실패:', error);
    throw error;
  }
};

/**
 * 헬퍼 함수: Base64 이미지를 File 객체로 변환
 * @param {string} dataUrl - base64 data URL
 * @param {string} filename - 파일명
 * @returns {File} File 객체
 */
export const dataURLtoFile = (dataUrl, filename) => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

/**
 * 헬퍼 함수: 이미지 크기 조정
 * @param {string} imageUrl - 입력 이미지 URL
 * @param {number} maxWidth - 최대 너비
 * @param {number} maxHeight - 최대 높이
 * @returns {Promise<string>} 리사이즈된 이미지의 base64 data URL
 */
export const resizeImage = (imageUrl, maxWidth = 1024, maxHeight = 1024) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 비율 유지하면서 크기 조정
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageUrl;
  });
};

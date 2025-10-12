// Aiapi.js - 리팩터링 및 불필요한 코드 제거

// 환경 변수 및 API 엔드포인트 정의
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY;
const STABILITY_API_URL = "https://api.stability.ai/v2beta/stable-image/generate/ultra";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-image-preview";

// Vision API 프롬프트 (이미지 분석용)
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

// 제품 타입 매핑 (한국어 -> 영어)
export const PRODUCT_TYPE_MAPPING = {
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
  '크림': ['cream', 'lotion', 'moisturizer'],
  '청소기': ['vacuum cleaner', 'cleaning appliance', 'suction device'],
  '진공청소기': ['vacuum cleaner', 'cleaning appliance', 'suction device'],
  '공기청정기': ['air purifier', 'air cleaner', 'air filtration device'],
  '에어컨': ['air conditioner', 'cooling device', 'climate control'],
  '선풍기': ['fan', 'cooling fan', 'ventilation device']
};

// 불필요한 함수/변수 제거 및 export 함수만 유지

// 예시: GPT-4o API로 텍스트 생성 (JSON 강제)
// (중복 선언 제거, 아래 실제 함수만 유지)

// 예시: OpenAI Vision API를 사용하여 이미지를 분석하는 함수
// (중복 선언 제거, 아래 실제 함수만 유지)

// 예시: Stability AI 이미지 생성 프롬프트 템플릿 (실제 사용시 구현 필요)
export const STABILITY_PROMPT_TEMPLATE = `You are a professional product designer specializing in creating optimized prompts for Stability AI image generation.

Create a detailed English prompt for Stability AI that will generate a high-quality product image based PRIMARILY on the product information below:

### PRIMARY PRODUCT INFORMATION (MOST IMPORTANT - BASE THE IMAGE ON THIS)
Title: {TITLE}
Description: {DESCRIPTION}

### Additional Context (Use only as supplementary reference)
{VISION_ANALYSIS}

{REFERENCE_IMAGE_INFO}

### Stability AI Ultra Model Prompt Requirements:
1. High-quality product visualization with realistic materials and textures
2. Complete product visibility - entire product should be visible within frame  
3. Professional product photography with good lighting
4. Clean background (white or subtle gradient)
5. Single product focus - avoid multiple items or distracting elements
6. Sharp focus and clear details
7. Full product view from optimal angle

Create a detailed English prompt (max 120 words) optimized for Ultra model that describes:
- The product type mentioned in the title and description
- Key features and improvements described in the product description  
- Appropriate materials, textures, and finishes for this specific product
- Professional photography setup
- Clean background and proper framing
- High-quality appearance

Focus on creating a prompt that will produce the product described in the title and description with good quality and complete visibility.

Output only the optimized English prompt:`;

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

// 4. 제외할 제품 키워드 (잘못 생성될 수 있는 제품들)
const UNWANTED_PRODUCT_KEYWORDS = [
  'phone', 'iphone', 'smartphone', 'monitor', 'screen', 
  'display', 'computer', 'laptop', 'tablet', 'electronics'
];

// 5. 필수 이미지 생성 키워드 (제품이 잘리지 않도록)
const ESSENTIAL_IMAGE_KEYWORDS = [
  { keywords: ['full product view', 'completely visible', 'entire product'], replacement: 'full product view, completely visible' },
  { keywords: ['not cropped', 'not cut off', 'proper framing'], replacement: 'not cropped, proper framing' },
  { keywords: ['adequate space', 'spacing around'], replacement: 'adequate spacing around product' },
  { keywords: ['professional'], replacement: 'professional product photography' },
  { keywords: ['white background', 'clean background'], replacement: 'clean white background' },
  { keywords: ['studio lighting'], replacement: 'studio lighting' }
];

// =============================================================================
// GPT-4o API 헬퍼 함수들
// =============================================================================



/**
 * 한글 텍스트를 영어로 번역하는 함수
 * @param {string} koreanText - 번역할 한글 텍스트
 * @returns {Promise<string>} 번역된 영어 텍스트
 */
async function translateToEnglish(koreanText) {
  if (!koreanText || typeof koreanText !== 'string') {
    return koreanText || '';
  }
  
  // 영어가 대부분인 경우 번역 스킵
  const koreanCharCount = (koreanText.match(/[\u3131-\uD79D]/g) || []).length;
  const totalCharCount = koreanText.length;
  
  if (koreanCharCount / totalCharCount < 0.3) {
    console.log('한글 비율이 낮아 번역 스킵:', koreanText.substring(0, 50) + '...');
    return koreanText;
  }
  
  try {
    const translatePrompt = `Translate the following Korean text to English naturally and accurately. Keep the meaning and tone intact. Only output the translated English text without any additional explanations or formatting.\n\nKorean text: "${koreanText}"`;
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional translator. Translate Korean to English accurately and naturally." },
          { role: "user", content: translatePrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      throw new Error(`번역 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content?.trim() || koreanText;
    
    console.log('번역 완료:');
    console.log('- 원본:', koreanText.substring(0, 50) + '...');
    console.log('- 번역:', translatedText.substring(0, 50) + '...');
    
    return translatedText;
    
  } catch (error) {
    console.warn('번역 실패, 원본 텍스트 사용:', error.message);
    return koreanText;
  }
}

/**
 * GPT-4o API로 텍스트 생성 (JSON 강제)
 * @param {string} prompt - 프롬프트 텍스트
 * @param {boolean|Object} forceJson - true면 JSON 모드 강제, 객체면 스키마
 * @param {number} temperature - 온도 (0.0-2.0)
 * @param {number} maxTokens - 최대 토큰 수
 * @returns {Promise<string>} 생성된 텍스트
 */
async function callGPTTextAPI(prompt, forceJson = false, temperature = 0.7, maxTokens = 2048) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
  };
  const body = {
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens: maxTokens
  };
  
  // JSON 모드 강제 (forceJson이 true이거나 스키마 객체인 경우)
  if (forceJson) {
    body.response_format = { type: "json_object" };
  }
  
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GPT API 요청 실패 (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * GPT-4o API로 이미지 분석
 * @param {string} imageUrl - 이미지 URL (base64 data URL)
 * @param {string} prompt - 분석 프롬프트
 * @returns {Promise<string>} 분석 결과
 */
async function callGPTVisionAPI(imageUrl, prompt) {
  try {
    console.log('GPT-4o Vision API 호출 시작');
    console.log('이미지 URL 타입:', imageUrl.startsWith('data:') ? 'data URL' : 'HTTP URL');
    console.log('Vision 프롬프트 (처음 200자):', prompt.substring(0, 200) + '...');
    
    if (!API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

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
            content: prompt
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
      const errorData = await response.text();
      throw new Error(`GPT-4o Vision API 오류: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('GPT-4o Vision API에서 유효한 응답을 받지 못했습니다.');
    }

    const responseText = data.choices[0].message.content;
    console.log('GPT-4o Vision API 응답 완료');
    console.log('Vision 응답 (처음 300자):', responseText.substring(0, 300) + '...');
    console.log('Vision 응답 전체 길이:', responseText.length);
    
    return responseText;
    
  } catch (error) {
    console.error('GPT-4o Vision API 호출 실패:', error);
    throw error;
  }
}

/**
 * URL을 Base64로 변환하는 헬퍼 함수 (Gemini API용) - Firebase Storage URL 지원
 * @param {string} url - 이미지 URL (Firebase Storage URL 또는 일반 URL)
 * @returns {Promise<{base64: string, mime: string}>} Base64 데이터와 MIME 타입
 */
async function urlToBase64(url) {
  try {
    // 이미 Base64 형식인 경우 (data:image/... 형태)
    if (url.startsWith('data:image/')) {
      const [header, base64Data] = url.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      return {
        base64: base64Data,
        mime: mimeMatch ? mimeMatch[1] : 'image/png'
      };
    }

    // Firebase Storage URL 또는 일반 URL 처리
    console.log('이미지 URL 처리 중:', url.substring(0, 100) + '...');
    
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`입력 이미지 가져오기 실패: ${res.status}`);
    
    const blob = await res.blob();
    console.log('이미지 크기:', (blob.size / 1024 / 1024).toFixed(2) + 'MB');
    
    const ab = await blob.arrayBuffer();

    // base64 변환 - 메모리 효율적으로 처리
    let binary = "";
    const bytes = new Uint8Array(ab);
    const chunk = 0x8000; // 32KB씩 처리
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    
    return {
      base64: btoa(binary),
      mime: blob.type || "image/png",
    };
  } catch (error) {
    console.error('URL to Base64 변환 실패:', error);
    console.error('- URL:', url);
    throw error;
  }
}


/**
 * Gemini API 호출 (이미지 + 텍스트)
 * @param {string} prompt - 프롬프트 텍스트
 * @param {string} imageUrl - 이미지 URL (base64 data URL 또는 일반 URL)
 * @param {number} temperature - 온도 (0.0-2.0)
 * @returns {Promise<{text: string, imageUrl?: string}>} 생성된 텍스트와 이미지 (있는 경우)
 */
async function callGeminiVisionAPI(prompt, imageUrl, temperature = 0.7) {
  try {
    console.log('Gemini Vision API 호출 시작');
    console.log('이미지 URL 타입:', imageUrl.startsWith('data:') ? 'data URL' : 'HTTP URL');
    console.log('Gemini Vision 프롬프트 (처음 200자):', prompt.substring(0, 200) + '...');
    console.log('Gemini Temperature:', temperature);
    
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API 키가 설정되지 않았습니다.');
    }

    // 이미지를 base64로 변환
    let base64Data, mimeType;
    
    if (imageUrl.startsWith('data:')) {
      // 이미 base64 data URL인 경우
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) throw new Error('잘못된 data URL 형식입니다.');
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      // 일반 URL인 경우 변환
      const { base64, mime } = await urlToBase64(imageUrl);
      base64Data = base64;
      mimeType = mime;
    }

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];

    // 결과 파싱
    let resultText = '';
    let resultImageUrl = '';

    for (const part of parts) {
      if (part.text) {
        resultText = part.text;
      }
      if (part.inlineData) {
        const outMime = part.inlineData.mimeType || "image/png";
        resultImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
      }
    }

    console.log('Gemini Vision API 응답 완료');
    console.log('Gemini Vision 텍스트 응답 (처음 500자):', resultText.substring(0, 500) + '...');
    console.log('Gemini Vision 텍스트 응답 전체 길이:', resultText.length);
    console.log('Gemini Vision 이미지 생성 여부:', !!resultImageUrl);
    if (resultImageUrl) {
      console.log('생성된 이미지 크기:', Math.round(resultImageUrl.length / 1024) + 'KB');
    }

    return {
      text: resultText,
      imageUrl: resultImageUrl || undefined
    };
  } catch (error) {
    console.error('Gemini Vision API 호출 실패:', error);
    throw error;
  }
}

// =============================================================================

// 첨가제 타입을 한국어로 변환하는 함수
const getAdditiveTypeName = (additiveType) => {
  const typeNames = {
    creativity: '창의성',
    aesthetics: '심미성', 
    usability: '사용성'
  };
  return typeNames[additiveType] || '기본';
};

/**
 * Gemini API용 프롬프트를 영어로 번역하는 함수
 * @param {string} koreanPrompt - 번역할 한국어 프롬프트
 * @returns {Promise<string>} 번역된 영어 프롬프트
 */
async function translateGeminiPrompt(koreanPrompt) {
  if (!koreanPrompt || typeof koreanPrompt !== 'string') {
    return koreanPrompt || '';
  }
  
  // 영어가 대부분인 경우 번역 스킵
  const koreanCharCount = (koreanPrompt.match(/[\u3131-\uD79D]/g) || []).length;
  const totalCharCount = koreanPrompt.length;
  
  if (koreanCharCount / totalCharCount < 0.3) {
    console.log('이미 영어가 많아 번역 스킵:', koreanPrompt.substring(0, 50) + '...');
    return koreanPrompt;
  }
  
  try {
    const translatePrompt = `한국어인 이미지 생성 프롬프트를 영어로 자연스럽게 번역해주세요. 최대한 잘못된 번역이 없도록 번역하세요. 번역된 영어 텍스트만 출력하고 추가 설명은 하지 마세요.\n\n한국어 프롬프트: "${koreanPrompt}"`;
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "당신은 전문 번역가입니다. 이미지 생성 프롬프트를 한국어에서 영어로 정확하고 자연스럽게 번역하세요." },
          { role: "user", content: translatePrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Gemini 프롬프트 번역 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    const translatedPrompt = data.choices?.[0]?.message?.content?.trim() || koreanPrompt;
    
    console.log('한→영 Gemini 프롬프트 번역 완료:');
    console.log('- 원본:', koreanPrompt.substring(0, 50) + '...');
    console.log('- 번역:', translatedPrompt.substring(0, 50) + '...');
    
    return translatedPrompt;
    
  } catch (error) {
    console.warn('Gemini 프롬프트 번역 실패, 원본 텍스트 사용:', error.message);
    return koreanPrompt;
  }
}

// 슬라이더 값을 Temperature로 변환
// 슬라이더 2: 첨가제 많이 → temperature 1.0 (높은 창의성, 자유로운 변형, 보존율 낮음)
// 슬라이더 1: 첨가제 적당히 → temperature 0.7 (균형잡힌 변형)
// 슬라이더 0: 첨가제 적게 → temperature 0.4 (보수적 변형, 보존율 높음)
const getTemperatureFromSlider = (sliderValue) => {
  const temperatureMap = {
    0: 0.4,  // 첨가제 적게 → 낮은 창의성, 보존율 높음, 미세한 변형
    1: 0.7,  // 첨가제 적당히 → 균형잡힌 창의성
    2: 1.0   // 첨가제 많이 → 높은 창의성, 보존율 낮음, 자유로운 변형
  };
  return temperatureMap[sliderValue] || 0.7;
};

// 슬라이더 값을 이미지 변형 강도(strength)로 변환
// 슬라이더 2: 첨가제 많이 → strength 0.85 (과감한 변화, 창의적 변형)
// 슬라이더 1: 첨가제 적당히 → strength 0.6 (적당한 변화)
// 슬라이더 0: 첨가제 적게 → strength 0.35 (미세한 변화, 원본 보존)
const getStrengthFromSlider = (sliderValue) => {
  const strengthMap = {
    0: 0.35,  // 첨가제 적게 → 약한 변형, 원본 고수준 보존
    1: 0.6,   // 첨가제 적당히 → 중간 변형
    2: 0.85   // 첨가제 많이 → 강한 변형, 창의적 재해석
  };
  return strengthMap[sliderValue] || 0.6;
};

// strength 값을 설명 텍스트로 변환 (Gemini API 프롬프트용)
const getStrengthDescription = (strength) => {
  if (strength >= 0.75) {
    // 많이 변형 (0.85) - 슬라이더 2 (첨가제 많이)
    return "HIGH INTENSITY (85% transformation): Apply bold and creative changes with high freedom. Transform 70-90% of characteristics while maintaining only the core concept. For aesthetics: Heavily incorporate reference image's style, colors, materials. Prioritize creativity and innovation over preservation.";
  } else if (strength >= 0.5) {
    // 적당히 변형 (0.6) - 슬라이더 1 (첨가제 적당히)
    return "MEDIUM INTENSITY (60% transformation): Apply balanced and moderate changes. Transform 40-60% of characteristics. For aesthetics: Transfer key elements from reference with good balance between preservation and innovation.";
  } else {
    // 조금 변형 (0.35) - 슬라이더 0 (첨가제 적게)
    return "LOW INTENSITY (35% transformation): Apply minimal and subtle changes with high preservation. Preserve 80-90% of original characteristics. For aesthetics: Lightly hint at reference style while keeping most of the original design intact. Focus on refinement over transformation.";
  }
};

/**
 * 레퍼런스 이미지 분석 함수 (심미성 첨가제용)
 * @param {string} imageUrl - 레퍼런스 이미지 URL
 * @returns {Promise<string>} 분석 결과
 */
export async function analyzeReferenceImage(imageUrl) {
  try {
    console.log('GPT-4o 레퍼런스 이미지 분석 시작:', imageUrl.substring(0, 50) + '...');
    
    const prompt = "당신은 디자인 전문가입니다. 제공된 레퍼런스 이미지의 심미적 특징을 분석하세요. 이 레퍼런스 이미지의 디자인 형태, 색상, 재질, 스타일적 특징을 간결하게 설명해 주세요.";
    
    // GPT-4o Vision API 사용
    const analysisResult = await callGPTVisionAPI(imageUrl, prompt);
    console.log('GPT-4o 레퍼런스 이미지 분석 완료');
    return analysisResult;
    
  } catch (error) {
    console.error('레퍼런스 이미지 분석 실패:', error);
    return '레퍼런스 이미지 분석을 수행할 수 없습니다.';
  }
}

/**
 * OpenAI Vision API를 사용하여 이미지를 분석하는 함수
 * @param {string} imageUrl - 분석할 이미지 URL (base64 data URL 형태)
 * @returns {Promise<string>} 이미지 분석 결과 텍스트
 */
export async function analyzeImageWithVision(imageUrl) {
  try {
    console.log('Vision API 이미지 분석 시작:', imageUrl.substring(0, 50) + '...');
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: VISION_ANALYSIS_PROMPT
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Vision API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.choices[0].message.content;
    
    console.log('Vision API 분석 완료:', result.substring(0, 100) + '...');
    return result;
    
  } catch (error) {
    console.error('Vision 분석 실패:', error);
    throw error;
  }
}

/**
 * GPT를 통해 이미지 편집 프롬프트를 생성하는 함수
 * @param {string} title - 개선된 제품의 제목
 * @param {string} description - 개선된 제품의 설명
 * @param {string} step4Description - step4의 구현 전략 설명
 * @param {string} additiveType - 첨가제 유형 (creativity, aesthetics, usability)
 * @returns {Promise<string>} 생성된 이미지 편집 프롬프트
 */
export async function createImageEditPrompt(title, description, step4Description, additiveType) {
  try {
    console.log('이미지 편집 프롬프트 생성 시작');
    
    const additiveTypeName = getAdditiveTypeName(additiveType);
    
    const prompt = `당신은 이미지 생성AI 프롬프트 전문가입니다. 주어진 제품 정보와 개선 전략을 바탕으로 이미지를 어떻게 수정해야 하는지에 대한 구체적인 프롬프트를 생성해주세요.

제품 정보:
- 제목: "${title}"
- 설명: "${description}"
- 첨가제 유형: ${additiveTypeName}
- 구현 전략: "${step4Description}"

요구사항:
1. 원본 이미지를 어떻게 수정해야 하는지 구체적으로 설명
2. ${additiveTypeName} 관점에서의 시각적 개선 방향 제시
3. 색상, 형태, 구조, 질감 등 구체적인 시각적 요소 언급
4. 제품의 기능과 가치가 시각적으로 드러나도록 하는 방법 제시
5. 사용자 경험을 개선하는 시각적 변화 제안

금지사항:
- 절대 배경 요소를 추가하지 마세요. 제품 자체의 변화에만 집중하세요. 배경색은 흰색 또는 투명으로 유지하세요.
- 사람이나 문자, 텍스트, 동물 등을 추가하지마세요. 제품 외의 요소는 절대 포함하지 마세요.
- 도면이나 그리드, 스케치 스타일을 사용하지 마세요. 실제 제품처럼 보이도록 하세요.

다음과 같은 형식으로 이미지 편집 지시사항을 작성해주세요:
"[구체적인 이미지 편집 지시사항]"

추가 설명이나 부연 설명 없이 편집 지시사항만 출력해주세요.`;

    const response = await callGPTTextAPI(prompt, false, 0.7, 300);
    const editPrompt = response.trim().replace(/^["']/, '').replace(/["']$/, '');
    
    console.log('이미지 편집 프롬프트 생성 완료:', editPrompt.substring(0, 100) + '...');
    return editPrompt;
    
  } catch (error) {
    console.error('이미지 편집 프롬프트 생성 실패:', error);
    // 기본 프롬프트 반환
    return `${title}의 ${getAdditiveTypeName(additiveType)} 특성을 강화하여 제품을 시각적으로 개선해주세요. ${description}`;
  }
}



//사례기반추론 정의
const CBR_ANALYSIS_THEORY = `
        제품디자인 사례를 속성(형태·재료·색 등) 단위로 구조화하여 분석하고, 입력 아이디어와의 유사도를 분석하여 적용 가능한 요소에 전이(transfer)하는 방법론입니다. 레퍼런스 이미지의 심미적 요소를 분석하여 사용자의 디자인에 전이(Transfer)시켜 발전된 아이디어를 제공해야합니다.
`;

// 과제 분석법 정의
const TASK_ANALYSIS_THEORY = `
        전통적인 과제 분석은 시스템을 사용하며 사용자들의 상호 작용에 대한 과학적 관점에서 접근한다. 사용자들의 행동, 행동 별 제품 시스템의 피드백, 또는 시스템의 움직임과 반응 등 주요 요소를 하나 하나 떼어놓고 분석한다. 과제분석은 맥락적 연구와 유사한 면이 있는데 이는 관찰이나 인터뷰를 비롯한 동일 방법들을 많이 사용하기 때문이다. 그러나 맥락적 연구가 사용자의 행동, 전체적 맥락 속에서의 의사 결정 과정과 상호작용등 전반적인 면을 포괄적으로 다루는데 반해, 과제 분석은 오로지 과제 자체에만 중점을 둔다는 점이 차이점이다. 이러한 과제 분석은 문서 인쇄 안내 시스템, 소프트 웨어 장치의 상호 작용 탐색에 이르기까지 모든 디자인 분야에 유용하게 쓰인다.
        과제 분석법은 사용자의 활동을 행동으로 세분화하고, 행동에 따른 제품이나 시스템의 움직임과 반응, 피드백, 작업의 맥락 등 각각의 주요 요소로 분류하여 정리한다. 분류를 마친 내용을 살펴보며 사용자의 움직임이나 반응에 대한 피드백을 작성하여 인사이트를 도출하는 방법론이다.
        참고요약:과제 분석법은 사용자가 특정 목표를 달성하기 위해 수행하는 구체적인 단계와 절차를 체계적으로 분석하는 방법론이다. 이는 제품을 사용하는 시나리오를 가정하고 사용자의 행동을 목표, 조작 등의 구조로 분해함으로써, 디자이너는 사용자가 실제로 어려움을 겪는 지점(Pain Point)을 구체적으로 확인할 수 있다. 이를 통해 사용자의 어려움을 해소하여 사용성을 향상시키는 아이디어를 제안할 수 있다. 
`;

// TRIZ 40가지 발명 원리 정의 (script.js와 동일)
const TRIZ_PRINCIPLES = `
    1. 분할: 시스템을 여러 개의 독립적 부분으로 나눠 모듈화하거나 조합 가능하게 한다.  
    2. 추출: 불필요하거나 방해되는 요소를 제거하고 필요한 부분만 추출한다.  
    4. 비대칭: 대칭 구조를 비대칭으로 바꾸어 성능이나 기능을 개선한다.  
    5. 결합: 서로 다른 기능이나 시스템을 결합해 하나로 통합한다.  
    6. 범용성: 하나의 시스템이 여러 기능을 수행하도록 다용도화한다.  
    8. 무게 없애기: 환경(공기, 부력 등)과 상호작용하여 물체의 무게를 상쇄시킨다.
    13. 반대로 하기: 문제 해결에 요구되는 작용을 거꾸로 하여 과정, 기능, 구조를 거꾸로 수행한다.  
    14. 곡선화/구형화: 직선이나 평면을 곡선이나 구형으로 바꿔 이점을 얻는다.  
    24. 중간 매개물: 작용을 수행하거나 전달하기 위해 중간 매개물을 사용한다.
    25. 자가 서비스: 물체 스스로 유익한 작용을 하고 유지보수 할 수 있게 한다.
    26. 복제: 실제 대신 모형이나 복제품을 활용한다.  
    29. 공기 및 유압 사용: 물체의 고체 부분을 기체나 액체로 대체한다. / 기체나 액체 부분은 팽창을 위해 공기나 물을 사용한다.
    32. 색깔 변화: 물체 또는 환경의 색, 투명도를 바꾼다.
    33. 균질성: 본체와 상호작용하는 주변 물체는 본체와 동일한 재료로 만든다.
    34. 폐기 및 재생: 사용 후 버리거나 회수해 재활용한다.  
`;

// GPT-4o-mini용 프롬프트 템플릿 
const GPT_MINI_PROMPTS = {
  creativity: (ideaTitle, ideaDescription, referenceAnalysis, sliderValue) => {
    // 슬라이더 강도에 따른 개선 정도 지시문
    const intensityGuidance = sliderValue === 0 
      ? "**매우 적극적이고 과감한 변형**: 원본 디자인에서 크게 벗어나도 좋습니다. 혁신적이고 파격적인 아이디어를 제시하세요. 기존 개념을 완전히 재구성하고, 새로운 패러다임을 제시하세요. 문제점을 해결하는데 있어 대담하고 창의적인 접근을 하세요."
      : sliderValue === 1
      ? "**균형잡힌 개선**: 원본의 핵심 특징을 유지하면서 눈에 띄는 개선을 제시하세요. 실용성과 창의성의 균형을 맞추세요."
      : "**보수적이고 점진적인 개선**: 원본 디자인을 최대한 유지하면서 미세하고 안정적인 개선만 제시하세요. 기존 구조를 크게 바꾸지 않고 세밀한 부분만 조정하세요.";
    
    return `
    당신은 창의적인 발상을 가진 제품 디자이너입니다.
    다음 OriginIdea의 정보를 바탕으로 TRIZ 40가지 발명 원리를 적용하여 인사이트를 추출하는 것이 목표입니다.
    인사이트를 도출할 때 형태, 외형, 심미적으로 발전하는 방향으로 접근하세요. 새로운 컨셉을 제시하는 느낌이면 좋습니다.
    설명은 최대한 자세히 작성하여 리포트의 분량으로 응답하세요.
    OriginIdeaTitle은 "${ideaTitle}" 을 의미합니다.
    총 4단계로 구성되어 있고, 각 Step별 title과 description을 JSON 형식으로 출력해야 합니다.
    출력해주는 말투는" 했어요.", "였어요.", "에요."를 사용하세요.
    각 Step별로 아래 요구사항을 참고하여 최종 json schema에 맞게 JSON 형식으로 작성하세요.

    **🎨 개선 강도 설정 (매우 중요):**
    ${intensityGuidance}

    **중요한 일관성 검증 요구사항**:
    응답하기 전에 반드시 다음 사항들을 5번 이상 교차 검증하세요:
    1. Step1에서 제기한 문제점들이 Step3의 각 단계에서 일관되게 언급되는지 확인
    2. Step3에서 도출한 문제점들이 Step4의 해결방안과 논리적으로 연결되는지 확인
    3. Step4에서 제시한 TRIZ 원리들이 실제로 Step3의 문제점들을 해결할 수 있는지 확인
    4. 전체 흐름에서 모순되는 내용이나 상반된 주장이 없는지 확인
    5. 각 Step의 내용이 OriginIdea의 실제 특성과 부합하는지 확인
    
    만약 검증 과정에서 모순이나 일관성 문제를 발견하면, 해당 부분을 수정하여 논리적 일관성을 유지하세요.

    ##Step1: 평가(총평)
    - title: OriginIdea의 장점이나 문제점을 객관적으로 분석하여 평가한 Step1의 Description의 내용을 1줄로 요약하세요.
    - description: OriginIdea의 장점이나 문제점을 객관적으로 분석하여 OriginIdea의 평가를 상세히 설명하세요. 다만 긍정적인 평가보다 부정적인 문제점을 찾아내는 것이 중요합니다. 최소 400자 이상 작성하세요.

    ##Step2: TRIZ 원리 적용
    - title: "창의성 첨가제를 ${sliderValue === 2 ? '많이' : sliderValue === 1 ? '적당히' : '조금'} 넣었어요!" 라고 고정적으로 출력해주세요.
    - description: TRIZ의 원리를 설명하는 단계입니다. TRIZ 발명 원리를 사용하게 되었을때, OriginIdea의 형태나 외형 심미적으로 어떻게 발전될 수 있는지에 대한 가능성을 제시하세요. 너무 자세하게 TRIZ 원리를 적용 했을 때의 가설을 설명하지 말고, 간단하게 소개하세요. ex){OriginIdeaTitle}에 TRIZ를 적용하면, 순차적으로 문제를 분석하고 문제에 따라 TRIZ 원리를 적용하여 디자인을 재구성하게 돼요.

    ##Step3: 원리 적용 과정
    - step3a, step3b, step3c: Step1의 평가 내용 및 OriginIdea의 정보를 연결지어 설명해야 합니다. 총 3개의 문제점을 도출해야 하며, 같은 문제점을 언급하지 않도록 주의하세요. step3a, step3b, step3c 외 별도의 항목 추가 금지. 절대로 해결 방법을 제시하지 말고 문제점 및 고민해야 할 과제를 제시하세요.
    - title: Step3의 Step1의 평가 및 OriginIdea의 정보를 바탕으로 문제점을 도출하여 소비자의 입장에서 1줄로 요약한 내용을 구어체로 작성합니다.
    - description: Step3.title에서 1줄로 요약한 내용을 상세히 스토리텔링 형식으로 설명합니다. 각 description은 최소 400자 이상 작성하세요.

    ##Step4: 인사이트 도출
    - title: Step3에서 제시한 OriginIdea의 문제점 3가지를 어떤 TRIZ 원리로 해결할 수 있을지 1줄로 요약한 내용을 구어체로 작성합니다.
    - description: Step4.title에서 1줄로 요약한 내용을 상세히 스토리텔링 형식으로 설명합니다. OriginIdea의 문제점을 해결할 수 있는 TRIZ 원리를 구체적으로 언급하고, 어떻게 바뀔 수 있는지 가능성을 제시하세요. **위에서 설정한 개선 강도에 맞춰 제안의 수준을 조절하세요.** 최소 600자 이상 작성하세요.
    
    **중요: 모든 텍스트는 반드시 한국어로만 작성하세요. 일본어, 중국어 등 외국어를 절대 사용하지 마세요. 기술 용어도 한국어로 표현하세요.**

    ##OriginIdea:
    title: ${ideaTitle}
    description: ${ideaDescription}

    ##TRIZ 40가지 발명 원리는 ${TRIZ_PRINCIPLES}를 참고하여 디자인에 적용할 수 있는 원리만을 사용하세요. 40가지의 발명 원리 중 15가지만 선정했습니다.

    ##JSON 형태 외 다른 설명 금지, 백틱이나 점 출력 금지, JSON 스키마 오류 없이 출력

    ##JSON schema:
    {
    "step1": {"title": "", "description": "400자 이상"},
    "step2": {"title": "", "description": ""},
    "step3": {
        "step3a": { "title": "", "description": "400자 이상" },
        "step3b": { "title": "", "description": "400자 이상" },
        "step3c": { "title": "", "description": "400자 이상" }
    },
    "step4": {"title": "", "description": "600자 이상"}
    }`;
  },

  aesthetics: (ideaTitle, ideaDescription, referenceAnalysis, sliderValue) => {
    const intensityGuidance = sliderValue === 2 
      ? "**매우 적극적이고 과감한 스타일 전이**: 레퍼런스 이미지의 디자인 요소를 대담하게 적용하세요. 원본의 형태, 재료, 색상을 혁신적으로 변형하고, 레퍼런스의 특징을 강하게 반영하세요."
      : sliderValue === 1
      ? "**균형잡힌 스타일 조화**: 원본과 레퍼런스의 특징을 적절히 융합하세요. 조화로운 개선을 제시하세요."
      : "**보수적이고 은은한 스타일 적용**: 원본의 특징을 최대한 유지하면서 레퍼런스의 요소를 미세하게만 적용하세요.";
    
    return `
    당신은 제품 디자인에서 심미성을 중심적으로 평가하는 전문가이며, 사례 기반 추론(Case-Based Reasoning) 방법론을 바탕으로 응답합니다.
    다음 OriginIdea의 정보와 레퍼런스 이미지 분석을 바탕으로 사례 기반 추론을 적용하여 인사이트를 추출하는 것이 목표입니다.
    인사이트를 도출할 때 형태, 재료, 색상 등의 속성을 분석하고 OriginIdea에 전이(Transfer)하는 방향으로 접근하세요.
    설명은 최대한 자세히 작성하여 리포트의 분량으로 응답하세요.
    OriginIdeaTitle은 "${ideaTitle}" 을 의미합니다.
    총 4단계로 구성되어 있고, 각 Step별 title과 description을 JSON 형식으로 출력해야 합니다.

    **🎨 개선 강도 설정 (매우 중요):**
    ${intensityGuidance}

   **중요한 일관성 검증 요구사항**:
    응답하기 전에 반드시 다음 사항들을 5번 이상 교차 검증하세요:
    1. Step1에서 제기한 심미적 문제점들이 Step3의 각 단계에서 일관되게 언급되는지 확인
    2. Step3에서 도출한 심미적 개선점들이 Step4의 레퍼런스 전이 방안과 논리적으로 연결되는지 확인
    3. Step4에서 제시한 사례 기반 해결책들이 실제로 Step3의 문제점들을 개선할 수 있는지 확인
    4. 전체 흐름에서 모순되는 심미적 평가나 상반된 주장이 없는지 확인
    5. 각 Step의 내용이 OriginIdea와 레퍼런스 이미지의 실제 특성과 부합하는지 확인
    
    만약 검증 과정에서 모순이나 일관성 문제를 발견하면, 해당 부분을 수정하여 논리적 일관성을 유지하세요.
    출력해주는 말투는" 했어요.", "였어요.", "에요."를 사용하세요.
    각 Step별로 아래 요구사항을 참고하여 최종 json schema에 맞게 JSON 형식으로 작성하세요.

    ##Step1: 평가(총평)
    - title: OriginIdea의 현재 심미적 특징과 한계점을 객관적으로 분석하여 평가한 Step1의 Description의 내용을 1줄로 요약하세요.
    - description: OriginIdea의 심미적 장점과 문제점을 객관적으로 분석하여 평가를 상세히 설명하세요. 형태, 색상, 재질 측면에서의 한계점을 중점적으로 찾아내는 것이 중요합니다. 최소 400자 이상 작성하세요.

    ##Step2: 사례 기반 추론 적용
    - title: "심미성 첨가제를 ${sliderValue === 2 ? '많이' : sliderValue === 1 ? '적당히' : '조금'} 넣었어요!" 라고 고정적으로 출력해주세요.
    - description: 사례 기반 추론 방법론을 설명하는 단계입니다. 레퍼런스 이미지의 우수한 디자인 사례를 어떻게 OriginIdea에 적용할 수 있는지에 대한 가능성을 제시하세요. ex) ${ideaTitle}에 사례 기반 추론을 적용하면, 레퍼런스 이미지의 디자인 속성을 형태, 재료, 색상 단위로 구조화하여 분석하고, 기존 아이디어와의 유사도를 분석하여 적용 가능한 요소를 전이하는 방식이에요.

    ##Step3: 속성 분석 및 전이 과정
    - step3a, step3b, step3c: 레퍼런스 이미지와 OriginIdea를 비교 분석해야 합니다. 3가지 핵심 속성(형태, 재료, 색상)별로 분석하되, 각각 다른 속성을 다뤄야 합니다. step3a, step3b, step3c 외 별도의 항목 추가 금지. 해결방법을 제시하지 말고 속성별 차이점과 전이 가능성을 분석하세요.
    - title: 레퍼런스 이미지의 우수한 디자인 속성이 OriginIdea에 어떻게 적용될 수 있는지 소비자 관점에서 1줄로 요약한 내용을 구어체로 작성합니다. 레퍼런스의 속성이 OriginIdea의 단점을 어떻게 보완하는지 작성하면 됩니다.
    - description: Step3.title에서 1줄로 요약한 내용을 상세히 분석하여 설명합니다. 형태/재료/색상 중 해당 step.title에 집중하여 설명하세요. 각 description은 최소 400자 이상 작성하세요.

    ##Step4: 심미적 인사이트 도출
    - title: Step3에서 분석한 3가지 속성의 전이를 통해 OriginIdea가 어떻게 심미적으로 개선될 수 있을지 1줄로 요약한 내용을 구어체로 작성합니다.
    - description: Step4.title에서 1줄로 요약한 내용을 상세히 설명합니다. 형태, 재료, 색상 속성의 종합적 전이를 통해 OriginIdea가 어떻게 시각적으로 발전할 수 있는지 구체적인 가능성을 제시하세요. **위에서 설정한 개선 강도에 맞춰 제안의 수준을 조절하세요.** 최소 600자 이상 작성하세요.
    
    **중요: 모든 텍스트는 반드시 한국어로만 작성하세요. 일본어, 중국어 등 외국어를 절대 사용하지 마세요. 기술 용어도 한국어로 표현하세요.**

    ##OriginIdea:
    title: ${ideaTitle}
    description: ${ideaDescription}

    ##레퍼런스 이미지 분석:
    ${referenceAnalysis}

    ##사례 기반 추론 방법론 이론 정보: ${CBR_ANALYSIS_THEORY} 

    ##JSON 형태 외 다른 설명 금지, 백틱이나 점 출력 금지, JSON 스키마 오류 없이 출력

    ##JSON schema:
    {
    "step1": {"title": "", "description": "400자 이상"},
    "step2": {"title": "", "description": ""},
    "step3": {
        "step3a": { "title": "", "description": "400자 이상" },
        "step3b": { "title": "", "description": "400자 이상" },
        "step3c": { "title": "", "description": "400자 이상" }
    },
    "step4": {"title": "", "description": "600자 이상"}
    }`;
  },

  usability: (ideaTitle, ideaDescription, referenceAnalysis, sliderValue) => {
    const intensityGuidance = sliderValue === 2 
      ? "**매우 적극적이고 혁신적인 사용성 개선**: 사용자 경험을 완전히 재설계하세요. 기존 사용 방식을 과감하게 변경하고, 혁신적인 기능을 추가하세요. 불편함을 근본적으로 해결하는 파격적인 제안을 하세요."
      : sliderValue === 1
      ? "**실용적이고 현실적인 개선**: 기존 사용 방식을 크게 바꾸지 않으면서 눈에 띄는 개선을 제시하세요."
      : "**보수적이고 점진적인 개선**: 현재 사용 방식을 최대한 유지하면서 작은 불편함만 해결하세요.";
    
    return `
    당신은 제품의 사용성(UX)을 테스트하는 전문 제품 디자이너입니다.
    다음 OriginIdea의 정보를 바탕으로 과제분석법(Task analysis)을 적용하여 인사이트를 추출하는 것이 목표입니다.
    인사이트를 도출할 때 기능, 요소, 차별 포인트를 발전하는 방향으로 접근하세요.
    설명은 최대한 자세히 작성하여 리포트의 분량으로 응답하세요.
    OriginIdeaTitle은 "${ideaTitle}" 을 의미합니다.
    총 4단계로 구성되어 있고, 각 Step별 title과 description을 JSON 형식으로 출력해야 합니다.
    출력해주는 말투는" 했어요.", "였어요.", "에요."를 사용하세요.
    각 Step별로 아래 요구사항을 참고하여 최종 json schema에 맞게 JSON 형식으로 작성하세요.

    **🎨 개선 강도 설정 (매우 중요):**
    ${intensityGuidance}

    **중요한 일관성 검증 요구사항**:
    응답하기 전에 반드시 다음 사항들을 5번 이상 교차 검증하세요:
    1. Step1에서 제기한 사용성 문제점들이 Step3의 각 시나리오에서 일관되게 언급되는지 확인
    2. Step3에서 도출한 사용자 시나리오의 문제점들이 Step4의 해결방안과 논리적으로 연결되는지 확인
    3. Step4에서 제시한 과제분석법 기반 해결책들이 실제로 Step3의 문제점들을 개선할 수 있는지 확인
    4. 전체 흐름에서 모순되는 사용성 평가나 상반된 주장이 없는지 확인
    5. 각 Step의 내용이 OriginIdea의 실제 사용 맥락과 부합하는지 확인
    
    만약 검증 과정에서 모순이나 일관성 문제를 발견하면, 해당 부분을 수정하여 논리적 일관성을 유지하세요.

    ##Step1: 평가(총평)
    - title: OriginIdea의 장점이나 문제점을 객관적으로 분석하여 평가한 Step1의 Description의 내용을 1줄로 요약하세요. 문제점이 여러 개가 있다면, 그 중 가장 중요한 문제점을 1개만 제시하세요.
    - description: OriginIdea의 장점이나 문제점을 객관적으로 분석하여 OriginIdea의 평가를 상세히 설명하세요. 다만 긍정적인 평가보다 부정적인 문제점을 찾아내는 것이 중요합니다. 최소 400자 이상 작성하세요.

    ##Step2: 과제분석법 적용
    주의할 점: ex) 예시와 똑같은 구조는 최대한 피하세요. OriginIdea의 특성에 맞게 자연스럽게 작성하세요.
    - title: "사용성 첨가제를 ${sliderValue === 2 ? '많이' : sliderValue === 1 ? '적당히' : '조금'} 넣었어요!" 라고 고정적으로 출력해주세요.
    - description: 과제 분석법을 설명하는 단계입니다. 과제 분석법을 사용하게 되었을때, OriginIdea의 기능이나 요소, 차별 포인트가 어떻게 발전될 수 있는지에 대한 가능성을 제시하세요. 너무 자세하게 과제 분석법을 적용 했을 때의 가설을 설명하지 말고, 간단하게 소개하세요. ex){OriginIdeaTitle}에 과제 분석법을 적용하면, 사용자가 실제로 이 제품을 사용할 때 어떤 순서로 어떤 행동을 하는지를 1단계부터 5단계까지 시나리오 흐름으로 분해한 뒤, 각 단계에서 발생할 수 있는 문제점을 찾아내고, 이를 중심으로 기능적 개선점을 도출하는 방식이에요.

    ##Step3: 과제 분석법 적용 과정
    주의할 점: ex) 예시와 똑같은 구조는 최대한 피하세요. OriginIdea의 특성에 맞게 자연스럽게 작성하세요.
    - step3a, step3b, step3c, step3d, step3e: Step1의 평가 내용 및 OriginIdea의 정보를 연결지어 설명해야 합니다. 총 5개의 시나리오를 도출해야 하며, OriginIdea를 사용하는 시나리오의 흐름이 자연스럽게 이어지도록 주의하세요. step3a, step3b, step3c, step3d, step3e 외 별도의 항목 추가 금지. OriginIdea를 사용하는 사용자의 상황을 시나리오 형식으로 구성하여 상황 별 문제점을 제시하세요. 절대로 해결 방법을 제시하지 말고 문제점 및 고민해야 할 과제를 제시하세요.
    - step3title: Step3의 description에 제시한 모든 상황을 종합하여 OriginIdea을 사용하는 소비자의 감정이나 느낌을 1줄로 요약한 내용을 구어체로 작성합니다. 너무 진부하고 1차원적인 내용으로 요약하는 것을 피하세요. 문제점이 여러 개가 있다면, 그 중 가장 중요한 문제점을 1개만 제시하세요. ex) {OriginIdeaTitle}을 사용하면서 앉는게 불편했어요.
    - description: 단계별 상황에 따라 사용자의 입장에서 느낀 단점이나 불편함을 상세히 묘사하며 설명합니다. 각 description은 최소 500자 이상 작성하세요. ex) 책을 꺼내고 나서 주변을 둘러보며 읽을 책을 고르려 했는데, 어떤 주제인지 알 수 없고, 정리 기준이 없어 오래 머물기 어려웠어요.

    ##Step4: 인사이트 도출
    - title: Step3에서 OriginIdea를 사용하는 시나리오에서 발견한 문제점을 해결할 수 있는 인사이트를 1줄로 요약한 내용을 구어체로 작성합니다.
    - description: Step4.title에서 1줄로 요약한 내용을 사용자의 입장에서 상세히 묘사하며 설명합니다. OriginIdea의 문제점이 어떻게 바뀔 수 있는지 가능성을 제시하세요. **위에서 설정한 개선 강도에 맞춰 제안의 수준을 조절하세요.** 최소 700자 이상 작성하세요.
    
    **중요: 모든 텍스트는 반드시 한국어로만 작성하세요. 일본어, 중국어 등 외국어를 절대 사용하지 마세요. 기술 용어도 한국어로 표현하세요.**

    ##OriginIdea:
    title: ${ideaTitle}
    description: ${ideaDescription}

    ##과제 분석법의 정보는 "${TASK_ANALYSIS_THEORY}"를 참고하여 제품 사용 시나리오와 문제점을 도출하는데 활용하세요.

    ##JSON 형태 외 다른 설명 금지, 백틱이나 점 출력 금지, JSON 스키마 오류 없이 출력

    ##JSON schema:
    {
    "step1": {"title": "", "description": "400자 이상"},
    "step2": {"title": "", "description": ""},
    "step3": {
        "step3title": { "title": "" },
        "step3a": { "description": "500자 이상" },
        "step3b": { "description": "500자 이상" },
        "step3c": { "description": "500자 이상" },
        "step3d": { "description": "500자 이상" },
        "step3e": { "description": "500자 이상" }
    },
    "step4": {"title": "", "description": "700자 이상"}
    }`;
  }
};

// =============================================================================
// LabPage에서 사용하는 메인 함수들
// =============================================================================



/**
 * LabPage에서 호출하는 메인 분석 함수 (script.js와 동일한 구조)
 * @param {string} additiveType - 첨가제 유형 (creativity, aesthetics, usability)
 * @param {string} ideaTitle - 아이디어 제목
 * @param {string} ideaDescription - 아이디어 설명
 * @param {string} visionAnalysis - Vision API 분석 결과 (사용 안함)
 * @param {string} referenceAnalysis - 레퍼런스 이미지 분석 (심미성용)
 * @param {number} sliderValue - 슬라이더 값 (사용 안함)
 * @returns {Promise<Object>} 분석 결과
 */
export async function analyzeIdea(additiveType, ideaTitle, ideaDescription, visionAnalysis, referenceAnalysis = null, sliderValue = 1) {
  // 입력 변수 유효성 검증
  if (!additiveType || typeof additiveType !== 'string') {
    console.error('analyzeIdea 실패: additiveType이 비어있음', additiveType);
    alert('분석을 위한 첨가제 타입이 선택되지 않았습니다.');
    throw new Error('첨가제 타입이 누락됨');
  }
  
  if (!ideaTitle || typeof ideaTitle !== 'string' || ideaTitle.trim() === '') {
    console.error('analyzeIdea 실패: ideaTitle이 비어있음', ideaTitle);
    alert('분석을 위한 아이디어 제목이 누락되었습니다.');
    throw new Error('아이디어 제목이 누락됨');
  }
  
  if (!ideaDescription || typeof ideaDescription !== 'string' || ideaDescription.trim() === '') {
    console.error('analyzeIdea 실패: ideaDescription이 비어있음', ideaDescription);
    alert('분석을 위한 아이디어 설명이 누락되었습니다.');
    throw new Error('아이디어 설명이 누락됨');
  }
  
  if (!GPT_MINI_PROMPTS[additiveType]) {
    console.error('analyzeIdea 실패: 지원하지 않는 첨가제 타입', additiveType);
    alert(`지원하지 않는 첨가제 타입입니다: ${additiveType}`);
    throw new Error('지원하지 않는 첨가제 타입');
  }
  
  try {
    console.log('GPT 분석 시작:', { ideaTitle, additiveType, sliderValue });
    console.log('아이디어 제목:', ideaTitle);
    console.log('아이디어 설명:', ideaDescription.substring(0, 100) + '...');
    console.log('첨가제 타입:', additiveType);
    console.log('슬라이더 값:', sliderValue);
    
    // 슬라이더 값을 temperature로 변환
    const temperature = getTemperatureFromSlider(sliderValue);
    console.log('계산된 temperature:', temperature);
    
    const prompt = GPT_MINI_PROMPTS[additiveType](ideaTitle, ideaDescription, referenceAnalysis, sliderValue)
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a professional designer who helps novice designers who are having problems developing ideas." },
          { role: "user", content: prompt }
        ],
        max_tokens: 4096,  // 2048 → 4096으로 증가 (더 자세한 응답)
        temperature: temperature  // 슬라이더 값에 따른 동적 temperature
      })
    });
    
    const data = await response.json();
    const text = data.choices[0].message.content;
    
    
    try {
      const stepData = JSON.parse(text);
      console.log('GPT 분석 완료:', stepData);
      
      // ResultReport에서 사용할 수 있도록 steps 배열로 변환
      const steps = [];
      if (additiveType === 'usability') {
        // 사용성: script.js의 step3title + step3a~e 구조
        steps.push({ stepNumber: 1, title: stepData.step1.title, description: stepData.step1.description });
        steps.push({ stepNumber: 2, title: stepData.step2.title, description: stepData.step2.description });
        steps.push({ 
          stepNumber: 3, 
          title: stepData.step3.step3title.title, 
          descriptions: [
            stepData.step3.step3a.description,
            stepData.step3.step3b.description,
            stepData.step3.step3c.description,
            stepData.step3.step3d.description,
            stepData.step3.step3e.description
          ]
        });
        steps.push({ stepNumber: 4, title: stepData.step4.title, description: stepData.step4.description });
      } else {
        // 창의성, 심미성: script.js의 step3a~c 구조
        steps.push({ stepNumber: 1, title: stepData.step1.title, description: stepData.step1.description });
        steps.push({ stepNumber: 2, title: stepData.step2.title, description: stepData.step2.description });
        steps.push({ 
          stepNumber: 3, 
          title: `${additiveType === 'creativity' ? 'TRIZ' : '스키마'} 원리 적용 과정`,
          subSteps: [
            { title: stepData.step3.step3a.title, description: stepData.step3.step3a.description },
            { title: stepData.step3.step3b.title, description: stepData.step3.step3b.description },
            { title: stepData.step3.step3c.title, description: stepData.step3.step3c.description }
          ]
        });
        steps.push({ stepNumber: 4, title: stepData.step4.title, description: stepData.step4.description });
      }
      
      return { steps: steps };
    } catch (e) {
      console.error("JSON parse error:", e, text);
      throw new Error("JSON 파싱 실패: 프롬프트를 조정하거나 response_format을 확인하세요.");
    }
    
  } catch (error) {
    console.error('아이디어 분석 실패:', error);
    throw error;
  }
}



/**
 * 1단계: GPT-4o-mini로 단계별 분석 
 * @param {string} additiveType - 첨가제 타입 (creativity, usability, aesthetics)
 * @param {string} ideaTitle - 아이디어 제목
 * @param {string} ideaDescription - 아이디어 설명
 * @param {string} referenceAnalysis - 레퍼런스 이미지 분석 (aesthetics용, 선택사항)
 * @returns {Promise<Object>} step별 분석 결과
 */
async function analyzeWithGPT(ideaTitle, ideaDescription, additiveType, temperature = 0.7) {
  // 입력 변수 유효성 검증
  if (!ideaTitle || typeof ideaTitle !== 'string' || ideaTitle.trim() === '') {
    console.error('GPT 분석 실패: ideaTitle이 비어있음', ideaTitle);
    alert('GPT 분석을 위한 아이디어 제목이 누락되었습니다.');
    throw new Error('아이디어 제목이 누락됨');
  }
  
  if (!ideaDescription || typeof ideaDescription !== 'string' || ideaDescription.trim() === '') {
    console.error('GPT 분석 실패: ideaDescription이 비어있음', ideaDescription);
    alert('GPT 분석을 위한 아이디어 설명이 누락되었습니다.');
    throw new Error('아이디어 설명이 누락됨');
  }
  
  if (!additiveType || typeof additiveType !== 'string') {
    console.error('GPT 분석 실패: additiveType이 비어있음', additiveType);
    alert('GPT 분석을 위한 첨가제 타입이 누락되었습니다.');
    throw new Error('첨가제 타입이 누락됨');
  }
  
  try {
    console.log('GPT-4o 분석 시작');
    console.log('아이디어 제목:', ideaTitle);
    console.log('아이디어 설명:', ideaDescription.substring(0, 100) + '...');
    console.log('첨가제 타입:', additiveType);
    
    const additiveTypeName = getAdditiveTypeName(additiveType);
    
    const prompt = `당신은 ${additiveTypeName} 분석 전문가입니다. 주어진 제품을 분석하고 개선 제안을 제공해주세요.

제품 정보:
- 제목: "${ideaTitle}"
- 설명: "${ideaDescription}"
- 집중 영역: ${additiveTypeName}

${additiveTypeName} 개선에 초점을 맞춘 상세한 4단계 분석을 제공해주세요:

1단계: 현재 상태 분석
- 이 제품의 현재 ${additiveTypeName} 측면을 분석
- 구체적인 강점과 약점 파악

2단계: 문제점 식별
- 어떤 ${additiveTypeName} 문제나 한계가 존재하는가?
- ${additiveTypeName}과 관련된 사용자 불편 사항은 무엇인가?

3단계: 개선 기회
- 어떤 ${additiveTypeName} 개선을 만들 수 있는가?
- 혁신적인 솔루션과 신기술 트렌드 고려

4단계: 구현 전략
- 이러한 ${additiveTypeName} 개선을 어떻게 구현할 수 있는가?
- 사용자 경험에 미칠 기대 효과는 무엇인가?

다음 JSON 형식으로 응답해주세요:
{
  "step1": {
    "title": "현재 상태 분석",
    "description": "상세한 분석 내용"
  },
  "step2": {
    "title": "문제점 식별", 
    "description": "상세한 분석 내용"
  },
  "step3": {
    "title": "개선 기회",
    "description": "상세한 분석 내용"
  },
  "step4": {
    "title": "구현 전략",
    "description": "상세한 분석 내용"
  }
}

중요: 유효한 JSON만 응답하세요. 추가 텍스트나 설명은 하지 마세요.`;

    const response = await callGPTTextAPI(prompt, true, temperature, 2048);
    const result = JSON.parse(response);
    
    console.log('GPT-4o 분석 완료:', result);
    return result;
    
  } catch (error) {
    console.error('GPT-4o 분석 실패:', error);
    // 기본 구조 반환
    return {
      step1: { title: "현재 상태 분석", description: "분석을 진행할 수 없습니다." },
      step2: { title: "문제점 식별", description: "문제점을 식별할 수 없습니다." },
      step3: { title: "개선 기회", description: "개선 기회를 찾을 수 없습니다." },
      step4: { title: "구현 전략", description: "구현 전략을 수립할 수 없습니다." }
    };
  }
}

/**
 * 2단계: GPT-4o-mini로 개선된 아이디어 생성
 * @param {string} originalDescription - 원본 설명
 * @param {string} step1Problems - step1에서 도출한 문제점들
 * @param {string} step3Analysis - step3의 상세 분석 내용
 * @param {string} step4Insight - step4의 인사이트
 * @returns {Promise<{title: string, description: string}>} 개선된 아이디어
 */
async function createImprovedIdea(originalDescription, step1Problems, step3Analysis, step4Insight) {
    // 입력 변수 유효성 검증
    if (!originalDescription || typeof originalDescription !== 'string' || originalDescription.trim() === '') {
        console.error('개선 아이디어 생성 실패: originalDescription이 비어있음', originalDescription);
        alert('개선 아이디어 생성을 위한 원본 설명이 누락되었습니다.');
        throw new Error('원본 설명이 누락됨');
    }
    
    if (!step1Problems || typeof step1Problems !== 'string' || step1Problems.trim() === '') {
        console.error('개선 아이디어 생성 실패: step1Problems가 비어있음', step1Problems);
        alert('개선 아이디어 생성을 위한 Step1 문제점 분석이 누락되었습니다.');
        throw new Error('Step1 문제점이 누락됨');
    }
    
    if (!step3Analysis || typeof step3Analysis !== 'string' || step3Analysis.trim() === '') {
        console.error('개선 아이디어 생성 실패: step3Analysis가 비어있음', step3Analysis);
        alert('개선 아이디어 생성을 위한 Step3 상세 분석이 누락되었습니다.');
        throw new Error('Step3 분석이 누락됨');
    }
    
    if (!step4Insight || typeof step4Insight !== 'string' || step4Insight.trim() === '') {
        console.error('개선 아이디어 생성 실패: step4Insight가 비어있음', step4Insight);
        alert('개선 아이디어 생성을 위한 GPT 분석 인사이트가 누락되었습니다.');
        throw new Error('Step4 인사이트가 누락됨');
    }
    
    try {
        console.log('GPT-4o-mini 개선 아이디어 생성 시작');
        console.log('원본 설명:', originalDescription.substring(0, 100) + '...');
        console.log('Step1 문제점:', step1Problems.substring(0, 100) + '...');
        console.log('Step3 분석:', step3Analysis.substring(0, 100) + '...');
        console.log('Step4 인사이트:', step4Insight.substring(0, 100) + '...');
        
        const prompt = `
    당신은 제품 문제 개선을 위해 도출된 종합적 분석을 바탕으로 발전된 아이디어를 생성하는 전문가입니다.
    아래 제공된 단계별 분석을 모두 종합하여 새롭게 개발된 아이디어의 제목과 설명을 생성하는 것이 목표입니다.
    반드시 JSON 형식으로 제목과 설명을 출력해야 합니다.

    ##분석 단계별 정보 종합:

    ###Step1 - 문제점 평가:
    "${step1Problems}"

    ###Step3 - 상세 분석 내용:
    "${step3Analysis}"

    ###Step4 - 최종 개선 인사이트:
    "${step4Insight}"

    ##원본 제품:
    "${originalDescription}"

    ##개선된 아이디어 생성 요구사항:
    1. 종합적 분석 반영: Step1의 문제점, Step3의 상세 분석, Step4의 인사이트를 모두 고려하여 해결책이 반영된 발전된 아이디어를 제시
    2. 문제점 해결 중심: Step1과 Step3에서 도출한 모든 문제점들이 Step4 인사이트를 바탕으로 디자인에 어떻게 적용되었는지 명확하게 반영
    3. 논리적 일관성: 각 단계의 분석이 서로 모순되지 않도록 구성
    4. 구체적 개선점: 추상적 표현보다는 구체적이고 실현 가능한 개선사항 중심으로 설명

    ##출력 형식:
    - title: 15자 이내, 기능과 가치를 드러내고, 창의적이고 기억에 남도록, 제품 차별화를 드러내세요. 일차원적인 단어 조합과 형용사는 피하세요.
    - description: 5-6문장(500자), Step1~4의 분석을 종합하여 어떤 문제점들이 어떻게 해결되었는지, 어떤 기능에 특화된 제품이 되었는지, 어떤 강점을 가지게 되었는지 구체적으로 설명하세요.

    ##주의사항:
    - 과도한 마케팅 표현 금지, 간결하고 구체적으로 작성
    - Step1~4의 내용에 모순이 발생하지 않도록 생성해야 함
    - JSON 형식 외에 다른 설명 없이, 백틱이나 점 출력 없이, JSON 스키마 오류 없이 출력

    JSON 스키마:
    {"title":"","description":""}
`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a concise product naming and concept copy expert." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 3000,  // 1500 → 3000으로 증가 (더 자세한 설명)
                response_format: { type: "json_object" },
                temperature: 0.6
            })
        });

        if (!response.ok) {
            throw new Error(`GPT API 오류: ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        
        console.log('GPT-4o-mini 개선 아이디어 응답:', text);
        
        const result = JSON.parse(text);
        console.log('개선된 아이디어:', result);
        
        return result;
        
    } catch (error) {
        console.error('GPT-4o-mini 개선 아이디어 생성 실패:', error);
        alert(`개선 아이디어 생성 중 오류가 발생했습니다: ${error.message}`);
        throw error;
    }
}

/**
 * 3단계: GPT-4o-mini로 이미지 수정 프롬프트 생성
 * @param {Object} improvedIdea - 개선된 아이디어 {title, description}
 * @param {string} step4Insight - step4의 인사이트
 * @param {string} additiveType - 첨가제 타입 (선택사항)
 * @returns {Promise<string>} Gemini용 이미지 수정 프롬프트
 */
// 개선된 이미지 프롬프트 생성 함수 - GPT 분석 결과를 구체적으로 반영
async function createImagePrompt(improvedIdea, step4Insight, additiveType = null) {
    // 입력 변수 유효성 검증
    if (!improvedIdea || !improvedIdea.title || !improvedIdea.description) {
        console.error('이미지 프롬프트 생성 실패: improvedIdea가 비어있음', improvedIdea);
        alert('이미지 생성을 위한 개선된 아이디어 데이터가 누락되었습니다.');
        throw new Error('개선된 아이디어 데이터가 누락됨');
    }
    
    if (!step4Insight || typeof step4Insight !== 'string' || step4Insight.trim() === '') {
        console.error('이미지 프롬프트 생성 실패: step4Insight가 비어있음', step4Insight);
        alert('이미지 생성을 위한 GPT 분석 결과(step4 인사이트)가 누락되었습니다.');
        throw new Error('Step4 인사이트가 누락됨');
    }
    
    console.log('GPT를 통한 구체적 시각적 변경 지시 생성 시작:');
    console.log('  - 제품명:', improvedIdea.title);
    console.log('  - 제품 설명:', improvedIdea.description.substring(0, 100) + '...');
    console.log('  - Step4 인사이트:', step4Insight.substring(0, 100) + '...');
    console.log('  - 첨가제 타입:', additiveType);
    
    // GPT에게 step4 인사이트를 구체적인 시각적 변경 지시로 변환 요청
    let systemPrompt = '';
    
    if (additiveType === 'aesthetics') {
        systemPrompt = `You are an expert at creating image modification prompts for Gemini 2.5 Flash image generation model.

TASK: Convert Step 4 aesthetic insight into a DIRECT, EXECUTABLE image modification prompt that Gemini can understand and apply.

PROMPT FORMAT (like the example):
"[Action verb] the [specific element] to [desired result]. [Specific visual instruction 1]. [Specific visual instruction 2]. [Specific visual instruction 3]."

EXAMPLE STRUCTURE:
"Transform the dress design to incorporate ocean-inspired aesthetics. Apply flowing blue gradient fabric with wave-like patterns. Add delicate white lace details at edges. Modify the silhouette to be more flowing and elegant with tiered layers."

KEY RULES:
1. START with a clear transformation goal (what to change overall)
2. SPECIFY exact visual changes: colors, materials, textures, patterns, shapes
3. USE concrete descriptors: "flowing blue gradient" not "nice blue"
4. MENTION specific elements: fabric, surface, structure, proportions
5. KEEP total length under 100 words
6. NO abstract concepts - only visual, tangible changes
7. Focus on AESTHETIC attributes: color palette, material finish, pattern, texture, form language

DO NOT:
- Use vague terms like "modern", "innovative", "better"
- Include reasoning or explanations
- Add generic examples or placeholder text
- Mention TRIZ principles or design theory

Output format: One clear paragraph of direct visual modification instructions.`;
    } else if (additiveType === 'creativity') {
        systemPrompt = `You are an expert at creating simple, direct image modification prompts for Gemini 2.5 Flash.

TASK: Based on TRIZ-based Step 4 insight, create concrete visual transformation instructions that explore NEW MATERIALS and STRUCTURAL INNOVATIONS.

PROMPT FORMAT (simple and direct):
"Using the provided image of [product], [material change instruction]. [structural change instruction]. [form innovation instruction]."

MATERIAL EXPLORATION PRIORITY:
- ENCOURAGE diverse material choices: acrylic, glass, metal (steel/aluminum/copper), ceramic, composite materials, carbon fiber, concrete, stone
- AVOID limiting to wood unless explicitly mentioned in Step 4 insight
- Mix different materials for innovation (e.g., "transparent acrylic body with brushed metal frame")

EXAMPLE:
"Using the provided image of this chair, replace the wooden structure with transparent acrylic panels. Add geometric metal frame in brushed steel. Create modular segmented backrest with adjustable sections."

KEY RULES:
1. START with "Using the provided image of [product name],"
2. SPECIFY material transformations (acrylic, glass, metal, ceramic, etc.)
3. Apply TRIZ-based structural innovations from Step 4
4. Focus on 2-4 key creative transformations
5. Total length: 50-80 words
6. Make it natural and actionable
7. Maintain PROFESSIONAL PRODUCT QUALITY - no crude or ugly elements

CRITICAL - MATERIAL DIVERSITY:
- If Step 4 mentions segmentation → Consider transparent/translucent materials
- If Step 4 mentions asymmetry → Mix contrasting materials (metal + glass)
- If Step 4 mentions curvature → Use moldable materials (acrylic, metal sheets)
- DO NOT default to wood - explore modern materials

DO NOT:
- Mention TRIZ principles by name
- Use abstract terms without visual detail
- Create unprofessional or crude-looking modifications
- Limit to single material type

Output format: Simple, concrete instructions with specific materials and structural changes.`;
    } else if (additiveType === 'usability') {
        systemPrompt = `You are an expert at creating simple, direct image modification prompts for Gemini 2.5 Flash.

TASK: Based on Task Analysis Step 4 insight, specify FUNCTIONAL IMPROVEMENTS and ERGONOMIC ENHANCEMENTS while maintaining professional design quality.

PROMPT FORMAT (simple and direct):
"Using the provided image of [product], [ergonomic improvement 1]. [functional feature addition 2]. [usability enhancement 3]."

USABILITY FOCUS AREAS:
- Ergonomic handles, grips, or contact points (specify size/shape/material)
- Control interfaces (buttons, switches, displays) - make them VISIBLE but ELEGANT
- Access points (doors, compartments, openings) - improve reachability
- Safety features (guards, indicators, non-slip surfaces)
- Operational convenience (wheels, handles, adjustable parts)

DESIGN QUALITY REQUIREMENTS:
- Functional elements must look PROFESSIONAL and REFINED
- Buttons/controls should be CLEARLY VISIBLE but AESTHETICALLY INTEGRATED
- Size modifications must maintain PROPORTIONAL HARMONY
- Added features should ENHANCE not CLUTTER the design

EXAMPLE:
"Using the provided image of this desk, add an integrated cable management channel along the back edge. Enlarge the side storage compartment with a soft-close sliding door. Add adjustable height mechanism with sleek control panel on the side."

KEY RULES:
1. START with "Using the provided image of [product name],"
2. Specify FUNCTIONAL additions/modifications that solve usability issues
3. Ensure added elements look PROFESSIONAL and WELL-DESIGNED
4. Focus on 2-4 key usability improvements
5. Total length: 50-80 words
6. Make it natural and actionable

CRITICAL - BALANCE FUNCTION & AESTHETICS:
- Make controls VISIBLE but not OVERSIZED or CRUDE
- Integrate features SEAMLESSLY into the design
- Use REFINED proportions and PROFESSIONAL finishes
- Prioritize USER EXPERIENCE improvements from Step 4

DO NOT:
- Mention Task Analysis methodology by name
- Create oversized, crude, or ugly functional elements
- Add features that look unprofessional or prototype-like
- Use vague terms like "better" or "improved"

Output format: Simple instructions specifying elegant functional improvements.`;
    } else {
        systemPrompt = `You are an expert product designer.

TASK: Based on Step 4 insight, create CLEAR and CONCISE modification instructions.

RULES:
- Keep instructions SHORT and SPECIFIC (max 3-4 sentences)
- Focus ONLY on changes mentioned in Step 4
- DO NOT include generic examples
- Make instructions ACTIONABLE for image generation AI`;
    }

    const userPrompt = `PRODUCT INFORMATION:
Name: ${improvedIdea.title}
Description: ${improvedIdea.description}

STEP 4 DESIGN INSIGHT:
${step4Insight}

YOUR TASK:
Convert the Step 4 insight into a direct image modification prompt that Gemini 2.5 Flash can execute.

REQUIREMENTS:
1. Extract the KEY VISUAL CHANGES from Step 4 insight
2. Convert abstract concepts into CONCRETE visual instructions
3. Specify EXACT changes: colors (with names/codes), materials (with texture descriptions), shapes (with geometric terms)
4. Use ACTION VERBS: Transform, Apply, Modify, Add, Change, Restructure
5. Total length: 80-100 words MAX
6. Write as ONE continuous paragraph

EXAMPLE OUTPUT STYLE:
"Transform the chair design to incorporate biophilic elements. Replace solid wooden backrest with vertically arranged bamboo slats (15mm spacing). Apply natural oak finish with visible wood grain texture. Add curved organic armrests flowing from seat to back. Modify leg structure to tripod base with gradual taper from 60mm to 40mm diameter."

Now create the modification prompt based on the product and Step 4 insight above. Output ONLY the prompt, nothing else.`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                max_tokens: 1000,  // 500 → 1000으로 증가 (더 상세한 이미지 프롬프트)
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`GPT API 오류: ${response.status}`);
        }

        const data = await response.json();
        const generatedPrompt = data.choices[0].message.content.trim();
        
        console.log('GPT가 생성한 구체적 시각적 변경 지시 (Step4 분석 포함):', generatedPrompt);
        return generatedPrompt;
        
    } catch (error) {
        console.error('GPT 프롬프트 생성 중 오류:', error);
        
        // Fallback: 기본 프롬프트 반환
        const fallbackPrompt = `Using the provided image of the ${improvedIdea.title.toLowerCase()}, modify it according to the following improvements: ${step4Insight}. 

Apply specific visual changes to the product's form, materials, colors, or components as suggested by the improvement insight. Keep the professional photography style and background, but make the enhancements clearly visible while maintaining the product's commercial appeal and realistic appearance.`;
        
        console.log('Fallback 프롬프트 사용:', fallbackPrompt);
        return fallbackPrompt;
    }
}

// Gemini 2.5 Flash Image 모델을 사용한 이미지 생성 함수 (공식 문서 기반)
async function generateImageWithGemini(imagePrompt, originalImageUrl, strength = 0.6) {
    try {
        console.log('Gemini 이미지 생성 시작 (gemini-2.5-flash-image-preview)');
        
        // 입력 이미지 검증
        if (!originalImageUrl || typeof originalImageUrl !== 'string' || originalImageUrl.trim() === '') {
            console.error('원본 이미지 URL 검증 실패:', { originalImageUrl, type: typeof originalImageUrl });
            throw new Error("원본 이미지 URL이 없거나 유효하지 않습니다.");
        }
        
        console.log('이미지 URL 검증 성공:', originalImageUrl.substring(0, 100) + '...');
        
        // 이미지를 base64로 변환
        const { base64, mime } = await urlToBase64(originalImageUrl);
        console.log("input image mime:", mime, "base64 length:", base64.length);

        // 강도 설명을 자연어로 구성
        const strengthGuidance = strength >= 0.75 
            ? 'Apply BOLD and RADICAL transformations. Completely reimagine the design with dramatic structural changes. Be extremely creative and experimental - this is the maximum transformation level.' 
            : strength >= 0.5 
            ? 'Apply noticeable improvements with moderate creative changes. Enhance key features with visible modifications while keeping the general concept.' 
            : 'Preserve the original design closely. Apply only subtle, refined improvements that enhance quality without major changes.';

        // Gemini 공식 프롬프트 형식: "Using the provided image of [subject], [action instructions]."
        const formattedPrompt = `Using the provided image of this product, ${imagePrompt}

Transformation Intensity:
${strengthGuidance}

${strength >= 0.75 ? `CRITICAL - MAXIMUM CREATIVITY MODE:
- Make DRAMATIC structural changes
- COMPLETELY transform the design elements
- Apply RADICAL innovations and unexpected modifications
- Do NOT worry about preserving original style - INNOVATE BOLDLY
- This is the HIGHEST transformation level - be EXTREMELY creative

` : strength >= 0.5 ? `MODERATE TRANSFORMATION MODE:
- Apply noticeable design changes
- Enhance features with visible modifications
- Balance between innovation and recognition
- Make clear improvements that are easy to spot

` : `MINIMAL TRANSFORMATION MODE:
- Preserve the original design closely
- Apply only subtle refinements
- Maintain recognizability as top priority
- Focus on quality enhancement over changes

`}Technical Requirements:
- Professional product photography quality
- Clean white or minimal background
- Realistic materials, textures, and lighting
- Focus on visual changes only (no text or descriptions)`;

        console.log('최종 프롬프트:', formattedPrompt);

        // Gemini API 요청 구조 (공식 문서 기반)
        const body = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: mime,
                            data: base64
                        }
                    },
                    { 
                        text: formattedPrompt
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                candidateCount: 1
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
        }

        const gemData = await response.json();
        console.log('API 응답 수신:', gemData?.candidates?.[0]?.content?.parts?.length || 0, '개 부분');
        
        const parts = gemData?.candidates?.[0]?.content?.parts || [];

        // script.js와 완전 동일한 결과 파싱
        let resultText = '';
        let resultImage = '';
        let outUrl;

        for (const part of parts) {
            if (part.text) {
                resultText = part.text;
            }
            if (part.inlineData) {
                resultImage = part.inlineData.data;
                const outMime = part.inlineData.mimeType || "image/png";
                outUrl = `data:${outMime};base64,${resultImage}`;
            }
        }
        
        console.log('파싱된 결과:', { resultText, resultImage: !!resultImage, outUrl: !!outUrl });

        if (!outUrl) {
            // script.js와 동일한 에러 처리
            if (resultText) {
                console.log("이미지 응답이 오지 않았습니다. 모델 응답 텍스트:", resultText);
            }
            throw new Error("응답에서 이미지 데이터를 찾지 못했습니다.");
        }

        console.log('이미지 생성 성공');
        return outUrl;
        
    } catch (error) {
        console.error('Gemini 이미지 생성 실패:', error);
        throw error;
    }
}

/**
 * Gemini로 2개 이미지 동시 입력하여 이미지 생성 (심미성 첨가제 전용)
 * @param {string} imagePrompt - 이미지 생성 프롬프트
 * @param {string} originalImageUrl - 원본 아이디어 이미지 URL (입력1)
 * @param {string} referenceImageUrl - 레퍼런스 이미지 URL (입력2)
 * @returns {Promise<string>} 생성된 이미지의 base64 data URL
 */
async function generateImageWithTwoInputs(imagePrompt, srcImageUrl, refImageUrl, strength = 0.6) {
    try {
        console.log('Gemini 2개 이미지 입력 생성 시작 (심미성 첨가제)');
        console.log('원본 이미지 URL:', srcImageUrl);
        console.log('레퍼런스 이미지 URL:', refImageUrl);
        console.log('이미지 프롬프트:', imagePrompt);

        // 두 이미지를 base64로 변환
        const srcImage = await urlToBase64(srcImageUrl);
        const refImage = await urlToBase64(refImageUrl);

        // Gemini API 요청 구조 - 심미성 첨가제 전용 (레퍼런스 스타일 전이)
        const aestheticsPrompt = `IMAGE TRANSFORMATION TASK:

TWO INPUT IMAGES:
1. ORIGINAL PRODUCT (first image): Product to be transformed
2. REFERENCE DESIGN (second image): Style source

YOUR TASK:
Transform the FIRST image's product to adopt aesthetic characteristics from the SECOND image.

TRANSFER FROM SECOND IMAGE:
- Color palette and combinations
- Material appearance and finish  
- Surface textures and patterns
- Visual style and mood

KEEP FROM FIRST IMAGE:
- Basic structure and form
- Product type and proportions

TRANSFORMATION STRENGTH: ${Math.round(strength * 100)}%

SPECIFIC MODIFICATIONS:
${imagePrompt}

OUTPUT REQUIREMENTS:
- Clean white background
- Professional product photography
- High resolution and detail
- Natural integration of changes

Generate ONLY the transformed product image.`;

        const requestBody = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: srcImage.mime,
                            data: srcImage.base64
                        }
                    },
                    {
                        inlineData: {
                            mimeType: refImage.mime,
                            data: refImage.base64
                        }
                    },
                    { 
                        text: aestheticsPrompt  // 영어 그대로 사용
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,  // 더 일관된 결과를 위해 낮춤
                maxOutputTokens: 8192,
                candidateCount: 1
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
        }

        const gemData = await response.json();
        console.log('Gemini API 응답:', gemData);
        
        const parts = gemData?.candidates?.[0]?.content?.parts || [];

        // 결과 파싱
        let resultText = '';
        let resultImage = '';
        let outUrl;

        for (const part of parts) {
            if (part.text) {
                resultText = part.text;
            }
            if (part.inlineData) {
                resultImage = part.inlineData.data;
                const outMime = part.inlineData.mimeType || "image/png";
                outUrl = `data:${outMime};base64,${resultImage}`;
            }
        }

        console.log('Gemini 파싱된 결과:', { resultText, resultImage: !!resultImage, outUrl: !!outUrl });

        if (!outUrl) {
            if (resultText) {
                console.warn("이미지 응답이 오지 않았습니다. 텍스트 응답만 있음:", resultText.substring(0, 200) + '...');
            } else {
                console.warn("이미지와 텍스트 모두 없는 빈 응답");
            }
            // 오류를 던지지 않고 null 반환
            return null;
        }

        console.log('Gemini 2개 이미지 입력 생성 성공');
        return outUrl;

    } catch (error) {
        console.error('Gemini 2개 이미지 입력 생성 실패:', error);
        alert(`2개 이미지 입력 생성 중 오류가 발생했습니다: ${error.message}`);
        throw error;
    }
}

/**
 * 4단계: Gemini로 이미지 생성 (기본 1개 입력)
 * @param {string} imagePrompt - 이미지 수정 프롬프트
 * @param {string} referenceImageUrl - 참조 이미지 URL
 * @returns {Promise<string>} 생성된 이미지의 base64 URL
 */
async function generateImage(imagePrompt, refImageUrl, strength = 0.6) {
    try {
        console.log('Gemini 이미지 생성 시작');
        console.log('이미지 프롬프트:', imagePrompt);
        console.log('참조 이미지 URL:', refImageUrl);

        // 참조 이미지를 base64로 변환
        const { base64, mime } = await urlToBase64(refImageUrl);

        // 간결한 프롬프트
        const finalPrompt = `${imagePrompt}

REQUIREMENTS:
- Modify ONLY the product in the reference image
- Transformation strength: ${Math.round(strength * 100)}%
- Clean white background
- Professional product photography
- Single product view
- High resolution

Generate ONLY the modified product image.`;

        const requestBody = {
            contents: [{
                parts: [
                    { 
                        text: finalPrompt  // 영어 그대로 사용
                    },
                    {
                        inlineData: {
                            mimeType: mime,
                            data: base64
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,  // 더 일관된 결과
                maxOutputTokens: 8192,
                candidateCount: 1
            }
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Gemini API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
        }

        const gemData = await response.json();
        console.log('Gemini API 응답:', gemData);
        
        const parts = gemData?.candidates?.[0]?.content?.parts || [];

        // 결과 파싱
        let resultText = '';
        let resultImage = '';
        let outUrl;

        for (const part of parts) {
            if (part.text) {
                resultText = part.text;
            }
            if (part.inlineData) {
                resultImage = part.inlineData.data;
                const outMime = part.inlineData.mimeType || "image/png";
                outUrl = `data:${outMime};base64,${resultImage}`;
            }
        }

        console.log('Gemini 파싱된 결과:', { resultText, resultImage: !!resultImage, outUrl: !!outUrl });

        if (!outUrl) {
            if (resultText) {
                console.warn("이미지 응답이 오지 않았습니다. 텍스트 응답만 있음:", resultText.substring(0, 200) + '...');
            } else {
                console.warn("이미지와 텍스트 모두 없는 빈 응답");
            }
            
            return null;
        }

        console.log('Gemini 이미지 생성 성공');
        return outUrl;

    } catch (error) {
        console.error('Gemini 이미지 생성 실패:', error);
        alert(`이미지 생성 중 오류가 발생했습니다: ${error.message}`);
        throw error;
    }
}


function extractStep4Insight(steps) {
  if (!steps) return null;

  // 1) 배열 스키마: [{ stepNumber: 4, description: ... }]
  if (Array.isArray(steps)) {
    const s4 = steps.find(s => s.stepNumber === 4);
    return s4?.description || null;
  }

  // 2) 객체 스키마: { step4: { description: ... } }
  if (typeof steps === 'object') {
    if (steps.step4?.description) return steps.step4.description;
    if (steps.steps && Array.isArray(steps.steps)) {
      const s4 = steps.steps.find(s => s.stepNumber === 4);
      return s4?.description || null;
    }
  }
  return null;
}

// Step1 문제점 추출 함수
function extractStep1Problems(steps) {
  if (!steps) return null;

  // 1) 배열 스키마: [{ stepNumber: 1, description: ... }]
  if (Array.isArray(steps)) {
    const s1 = steps.find(s => s.stepNumber === 1);
    return s1?.description || null;
  }

  // 2) 객체 스키마: { step1: { description: ... } }
  if (typeof steps === 'object') {
    if (steps.step1?.description) return steps.step1.description;
    if (steps.steps && Array.isArray(steps.steps)) {
      const s1 = steps.steps.find(s => s.stepNumber === 1);
      return s1?.description || null;
    }
  }
  return null;
}

// Step3 상세 분석 추출 함수 (첨가제 타입에 따라 다른 구조 처리)
function extractStep3Analysis(steps, additiveType) {
  if (!steps) return null;

  let step3Data = null;

  // 1) 배열 스키마: [{ stepNumber: 3, ... }]
  if (Array.isArray(steps)) {
    step3Data = steps.find(s => s.stepNumber === 3);
  }
  // 2) 객체 스키마: { step3: { ... } }
  else if (typeof steps === 'object') {
    if (steps.step3) {
      step3Data = steps.step3;
    } else if (steps.steps && Array.isArray(steps.steps)) {
      step3Data = steps.steps.find(s => s.stepNumber === 3);
    }
  }

  if (!step3Data) return null;

  // 첨가제 타입에 따라 다른 구조 처리
  if (additiveType === 'usability') {
    // 사용성: descriptions 배열 구조
    if (step3Data.descriptions && Array.isArray(step3Data.descriptions)) {
      return step3Data.descriptions.join('\n\n');
    }
  } else {
    // 창의성, 심미성: subSteps 배열 구조
    if (step3Data.subSteps && Array.isArray(step3Data.subSteps)) {
      return step3Data.subSteps.map(sub => 
        `${sub.title}: ${sub.description}`
      ).join('\n\n');
    }
    // 또는 직접 step3a, step3b, step3c 구조
    else if (steps.step3?.step3a || steps.step3?.step3b || steps.step3?.step3c) {
      const parts = [];
      if (steps.step3.step3a) parts.push(`${steps.step3.step3a.title}: ${steps.step3.step3a.description}`);
      if (steps.step3.step3b) parts.push(`${steps.step3.step3b.title}: ${steps.step3.step3b.description}`);
      if (steps.step3.step3c) parts.push(`${steps.step3.step3c.title}: ${steps.step3.step3c.description}`);
      return parts.join('\n\n');
    }
  }

  // 기본적으로 description이 있으면 반환
  return step3Data.description || null;
}

// 분석 인사이트 텍스트 변환 (스키마 유연 지원)
function stepsToText(steps) {
  if (Array.isArray(steps)) {
    return steps.map(step =>
      `Step ${step.stepNumber}: ${step.title}\n${step.description || ''}`
    ).join('\n\n');
  }
  // 객체 스키마
  const s = steps || {};
  const lines = [];
  if (s.step1) lines.push(`Step 1: ${s.step1.title}\n${s.step1.description || ''}`);
  if (s.step2) lines.push(`Step 2: ${s.step2.title}\n${s.step2.description || ''}`);
  if (s.step3) lines.push(`Step 3: ${s.step3.title || '개선 기회'}\n${
    s.step3.description ||
    s.step3.step3title?.title ||
    Object.values(s.step3).filter(v=>v?.description).map(v=>v.description).join('\n') || ''
  }`);
  if (s.step4) lines.push(`Step 4: ${s.step4.title}\n${s.step4.description || ''}`);
  return lines.join('\n\n');
}

// improveProduct 내부 일부 교체
export async function improveProduct(
  originalTitle, 
  originalDescription, 
  stepsData, 
  additiveType, 
  visionResult = '', 
  srcImageUrl = null,
  referenceImageUrl = null,
  sliderValue = 1
) {
    try {
        console.log('🎨 제품 개선 4단계 프로세스');
        console.log('- 원본 제목:', originalTitle);
        console.log('- 첨가제 타입:', additiveType);
        console.log('- 원본 이미지 URL 있음:', !!srcImageUrl);
        console.log('- 레퍼런스 이미지 URL 있음:', !!referenceImageUrl);
        console.log('- 슬라이더 값:', sliderValue);
        
        // 슬라이더 값을 이미지 변형 강도(strength)로 변환
        const strength = getStrengthFromSlider(sliderValue);
        console.log('- 계산된 strength:', strength);
        
        // 사용하지 않는 매개변수 방지
        void visionResult;

        // Step별 인사이트 추출 및 유효성 검증 (스키마 유연 지원)
        const step1Problems = extractStep1Problems(stepsData);
        const step3Analysis = extractStep3Analysis(stepsData, additiveType);
        const step4Insight = extractStep4Insight(stepsData);
        
        if (!step1Problems || typeof step1Problems !== 'string' || step1Problems.trim() === '') {
          console.error('Step1 문제점 추출 실패:', { stepsData, step1Problems });
          alert('GPT 분석 결과에서 Step 1 문제점을 찾을 수 없습니다.\n분석 결과를 다시 확인해주세요.');
          throw new Error('Step 1 문제점을 찾을 수 없습니다.');
        }
        
        if (!step3Analysis || typeof step3Analysis !== 'string' || step3Analysis.trim() === '') {
          console.error('Step3 분석 추출 실패:', { stepsData, step3Analysis });
          alert('GPT 분석 결과에서 Step 3 상세 분석을 찾을 수 없습니다.\n분석 결과를 다시 확인해주세요.');
          throw new Error('Step 3 분석을 찾을 수 없습니다.');
        }
        
        if (!step4Insight || typeof step4Insight !== 'string' || step4Insight.trim() === '') {
          console.error('Step4 인사이트 추출 실패:', { stepsData, step4Insight });
          alert('GPT 분석 결과에서 Step 4 인사이트를 찾을 수 없습니다.\n분석 결과를 다시 확인해주세요.');
          throw new Error('Step 4 인사이트를 찾을 수 없습니다.');
        }
        
        console.log('Step1 문제점 추출 성공:', step1Problems.substring(0, 100) + '...');
        console.log('Step3 분석 추출 성공:', step3Analysis.substring(0, 100) + '...');
        console.log('Step4 인사이트 추출 성공:', step4Insight.substring(0, 100) + '...');

        // 2단계: GPT-4o-mini로 개선된 아이디어 생성 (종합적 분석 반영)
        const improvedIdea = await createImprovedIdea(originalDescription, step1Problems, step3Analysis, step4Insight);
        console.log('개선된 아이디어 생성 완료:', improvedIdea.title);
        
        // 3단계: 상세한 이미지 프롬프트 생성 (GPT 분석 결과 반영)
        const imagePrompt = await createImagePrompt(
            improvedIdea,
            step4Insight, 
            additiveType
        );
        console.log('상세한 이미지 프롬프트 생성 완료');
        console.log('프롬프트 내용:', imagePrompt);

        // 개선된 제품 정보 생성 시 stepsToText 사용
        // (아래 improveProductInfo 호출부 등에서 stepsToText(stepsData) 사용 가능)
        // 예시:
        // const stepsText = stepsToText(stepsData);
        // const improvePrompt = `... [분석 인사이트]\n${stepsText}\n\n[스키마]\n{ ... } ...`;

        // 4단계: Gemini로 이미지 생성 (심미성 첨가제는 2개 입력, 나머지는 1개 입력)
        let finalImageUrl = srcImageUrl;
        let imageGenerationSuccess = false;
        let imageGenerationError = null;
        
        console.log('이미지 URL 검증:');
        console.log('- srcImageUrl:', srcImageUrl?.substring(0, 100) + '...');
        console.log('- srcImageUrl 유효성:', !!srcImageUrl);
        console.log('- referenceImageUrl:', referenceImageUrl?.substring(0, 100) + '...');
        console.log('- referenceImageUrl 유효성:', !!referenceImageUrl);
        
        if (srcImageUrl && typeof srcImageUrl === 'string' && srcImageUrl.trim() !== '') {
            try {
                let generatedImageUrl;
                
                // 🎨 심미성 첨가제: 2개 이미지 입력 (원본 + 레퍼런스)
                if (additiveType === 'aesthetics' && referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.trim() !== '') {
                    console.log('🎨 심미성 첨가제: 2개 이미지 입력으로 Gemini 호출');
                    console.log('  - 원본 이미지:', srcImageUrl.substring(0, 100) + '...');
                    console.log('  - 레퍼런스 이미지:', referenceImageUrl.substring(0, 100) + '...');
                    console.log('  - 이미지 변형 강도 (strength):', strength);
                    
                    generatedImageUrl = await generateImageWithTwoInputs(
                        imagePrompt, 
                        srcImageUrl, 
                        referenceImageUrl,
                        strength
                    );
                } 
                // ⚡ 기타 첨가제: 1개 이미지 입력 (원본만)
                else {
                    console.log('⚡ 기본 모드: 1개 이미지 입력으로 Gemini 호출');
                    console.log('  - 이미지 변형 강도 (strength):', strength);
                    generatedImageUrl = await generateImageWithGemini(imagePrompt, srcImageUrl, strength);
                }
                
                // 이미지 생성 결과 처리
                if (generatedImageUrl) {
                    finalImageUrl = generatedImageUrl;
                    imageGenerationSuccess = true;
                    console.log('✅ Gemini 이미지 생성 완료');
                } else {
                    console.warn('⚠️ Gemini 이미지 생성 실패 - 텍스트만 응답');
                    finalImageUrl = srcImageUrl;
                    imageGenerationSuccess = false;
                    imageGenerationError = 'Gemini API에서 이미지 대신 텍스트만 응답했습니다.';
                }
            } catch (imageError) {
                console.error('❌ Gemini 이미지 생성 실패:', imageError);
                imageGenerationError = imageError.message;
                // 원본 이미지 유지
            }
        } else {
            console.warn('⚠️ 원본 이미지 URL이 없어 이미지 생성을 건너뜁니다.');
            finalImageUrl = null;
            imageGenerationError = '원본 이미지 URL이 없어 이미지 생성을 수행할 수 없습니다.';
        }
        
        console.log('✅ 제품 개선 성공');
        
        return {
            title: improvedIdea.title,
            description: improvedIdea.description,
            imageUrl: finalImageUrl,
            originalImagePrompt: imagePrompt,
            imageGenerationSuccess,
            imageGenerationError,
            generatedBy: imageGenerationSuccess ? 'gemini' : 'none'
        };
        
    } catch (error) {
        console.error('제품 개선 오류:', error);
        alert(`제품 개선 중 오류가 발생했습니다: ${error.message}`);
        throw error;
    }
}

/**
 * improveProduct 함수의 alias - LabPage.jsx에서 사용하는 함수명과 맞춤
 * @param {string} originalTitle - 원본 제품 제목
 * @param {string} originalDescription - 원본 제품 설명
 * @param {Array} stepsData - GPT 분석 단계 데이터
 * @param {string} additiveType - 첨가제 타입
 * @param {string} visionResult - Vision 분석 결과 (선택사항)
 * @param {string} srcImageUrl - 원본 아이디어 이미지 URL (선택사항)
 * @param {string} referenceImageUrl - 레퍼런스 이미지 URL (심미성 첨가제용, 선택사항)
 * @param {number} sliderValue - 슬라이더 값 (0: 많이 변형, 1: 적당히, 2: 조금 변형)
 * @returns {Promise<Object>} 개선된 제품 정보
 */
export const improveProductInfo = async (
  originalTitle, 
  originalDescription, 
  stepsData, 
  additiveType, 
  visionResult = '', 
  srcImageUrl = null,
  referenceImageUrl = null,
  sliderValue = 1
) => {
    console.log('🎨 improveProductInfo 호출:', {
      originalTitle,
      additiveType,
      hasSrcImage: !!srcImageUrl,
      hasReferenceImage: !!referenceImageUrl,
      sliderValue
    });
    
    return await improveProduct(
      originalTitle, 
      originalDescription, 
      stepsData, 
      additiveType, 
      visionResult, 
      srcImageUrl,
      referenceImageUrl,
      sliderValue
    );
};

/**
 * 제품 태그를 생성하는 함수 (CanvasPage.jsx에서 사용)
 * @param {string} visionAnalysis - 이미지 분석 결과 (사용하지 않을 수 있음)
 * @param {string} title - 제품 제목
 * @param {string} description - 제품 설명
 * @returns {Promise<string>} 생성된 제품 태그 (예: "#생활용품")
 */
export const generateProductTag = async (visionAnalysis, title, description) => {
  try {
    console.log('제품 태그 생성 시작:', { title, description });
    
    const prompt = `다음 제품 정보를 바탕으로 적절한 제품 태그를 하나만 생성해주세요.

제품 제목: ${title}
제품 설명: ${description}

규칙:
1. 한국어로 작성
2. # 기호로 시작 (예: #생활용품, #가구, #전자제품)
3. 간단하고 명확한 카테고리명
4. 하나의 태그만 생성
5. 특수문자나 공백 없이 한 단어로

응답은 태그만 출력하세요 (설명 없이).`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates product tags in Korean."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`태그 생성 API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    let tag = data.choices[0].message.content.trim();
    
    // 태그 형식 정리
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }
    
    // 공백 제거
    tag = tag.replace(/\s+/g, '');
    
    console.log('생성된 태그:', tag);
    return tag;
    
  } catch (error) {
    console.error('제품 태그 생성 실패:', error);
    // 기본 태그 반환
    return '#생활용품';
  }
};

// IFL(랜덤 아이디어 생성) 함수 - GPT-4o 사용
export const generateRandomIdea = async (userPrompt) => {
  try {
    console.log('랜덤 아이디어 생성 시작:', userPrompt);
    
    const prompt = `당신은 창의적인 제품 디자인 전문가입니다. 
사용자가 입력한 키워드를 바탕으로 혁신적이고 실용적인 제품 아이디어를 생성해주세요.

키워드: ${userPrompt}

다음 JSON 형식으로 응답해주세요:
{
  "title": "제품 이름",
  "description": "제품 설명",
  "imagePrompt": "이미지 프롬프트"
}

요구사항:
1. title: 한글로 된 간결하고 창의적인 제품 이름 (예: "스마트 자세 교정 의자")
2. description: 한글로 된 상세한 설명, 3-4문장 (기능, 사용법, 특징, 아이디어 기획 이유 포함)
3. imagePrompt: 영어로 작성, 구체적인 제품 설명 포함. 반드시 다음 구조로 작성:
   - 첫 번째: 구체적인 제품 종류와 핵심 기능 설명 (예: "Modern adjustable standing desk with integrated tablet holder and cable management")
   - 두 번째: 디자인 스타일과 재질 (예: "minimalist design, wooden surface with metal legs")
   - 세 번째: 촬영 스타일 "premium product photography, clean white background, studio lighting, centered composition"

중요: imagePrompt는 제품의 구체적인 특징을 명확히 설명해야 합니다. 추상적인 표현은 피하고, 실제 제품의 형태와 기능을 정확히 묘사하세요.

위 형식을 정확히 따라 JSON만 출력하세요.`;

    // GPT-4o API 사용 (JSON 모드 강제)
    const responseText = await callGPTTextAPI(prompt, true, 0.8, 600);
    
    console.log('📝 GPT 응답:', responseText.substring(0, 200) + '...');
    
    // JSON 파싱
    let ideaData;
    try {
      ideaData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON 파싱 실패, 응답:', responseText);
      // JSON 블록 추출 시도
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ideaData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('유효한 JSON을 찾을 수 없습니다.');
      }
    }
    
    console.log('✅ GPT-4o 랜덤 아이디어 생성 완료:', ideaData.title);
    console.log('📝 생성된 이미지 프롬프트:', ideaData.imagePrompt);
    
    return {
      title: ideaData.title || '새로운 아이디어',
      description: ideaData.description || '혁신적인 제품 아이디어입니다.',
      imagePrompt: ideaData.imagePrompt || `Premium ${userPrompt} product rendering, professional studio photography, clean white background, commercial grade visualization, sleek modern design, Apple-style product photography, high-end aesthetic, full product view, studio lighting setup`
    };
    
  } catch (error) {
    console.error('❌ 랜덤 아이디어 생성 실패:', error);
    throw error;
  }
};

// Stability AI 이미지 생성 함수 (IFL용)
export const generateImageWithStability = async (prompt) => {
  try {
    console.log('🎨 Stability AI Ultra 이미지 생성 시작');
    console.log('📝 원본 프롬프트:', prompt);
    
    if (!STABILITY_API_KEY) {
      throw new Error('Stability AI API 키가 설정되지 않았습니다.');
    }

    // 프롬프트 최적화 - GPT가 생성한 프롬프트를 기반으로 Ultra 모델용 키워드 추가
    const ultraPrompt = `${prompt}, premium product rendering, commercial photography quality, photorealistic materials, ultra-sharp details, 8K resolution, professional color grading, perfect lighting, commercial grade visualization`;
    
    console.log('✨ Ultra 최적화 프롬프트:', ultraPrompt);

    // FormData 생성 - Ultra 모델용 최고품질 제품 렌더링
    const formData = new FormData();
    formData.append('prompt', ultraPrompt);
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
      console.error('❌ Stability AI API 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Stability AI API 요청 실패 (${response.status}): ${errorText.substring(0, 200)}`);
    }

    // 이미지 데이터를 Base64로 변환
    const imageBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    
    // Blob을 사용한 안전한 Base64 변환
    const blob = new Blob([uint8Array], { type: 'image/png' });
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
    console.log('✅ Stability AI Ultra 이미지 생성 완료, Base64 길이:', base64Image.length);
    return base64Image;
    
  } catch (error) {
    console.error('❌ Stability AI 이미지 생성 실패:', error);
    throw error;
  }
};









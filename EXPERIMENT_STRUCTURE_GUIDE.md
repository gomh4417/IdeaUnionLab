# 실험 저장 구조 가이드

## 📋 개요

IdeaUnionLab의 실험 저장 구조가 **알파벳 접미사 시스템**으로 개선되었습니다.
같은 아이디어에서 여러 실험을 수행할 때 각 실험을 명확히 구분할 수 있습니다.

## 🏗️ Firebase 저장 구조

### 기본 구조
```
projects/
  {projectId}/
    ideas/
      idea_001 (원재료)
        experiments/
          exp_001_A → result_idea_001 생성
          exp_001_B → result_idea_002 생성
          
      result_idea_001 (1차 생성물 A)
        sourceIdeaId: "idea_001"
        sourceExperimentId: "exp_001_A"
        experiments/
          exp_001_A → result_idea_003 생성
          exp_001_B → result_idea_004 생성
          
      result_idea_002 (1차 생성물 B)
        sourceIdeaId: "idea_001"
        sourceExperimentId: "exp_001_B"
        experiments/
          exp_001_A → result_idea_005 생성
```

## 🔤 실험 ID 명명 규칙

### 형식
```
exp_{번호}_{알파벳}
```

### 예시
- `exp_001_A`: 첫 번째 실험의 A 변형
- `exp_001_B`: 첫 번째 실험의 B 변형
- `exp_001_C`: 첫 번째 실험의 C 변형

### 알파벳 할당 로직
1. **첫 실험**: `exp_001_A`
2. **같은 아이디어에서 두 번째 실험**: `exp_001_B`
3. **같은 아이디어에서 세 번째 실험**: `exp_001_C`
4. 이후 D, E, F... 순차적으로 증가

## 📊 첨부 이미지의 저장 구조 매핑

```
원재료 아이디어
  ↓ 사용성 첨가제 실험 (exp_001_A)
1차 생성물(A)
  ↓ 창의성 첨가제 실험 (exp_001_A)
2차 생성물(A)
  ├─ History: [1차(A), 2차(A)]
  └─ sourceExperimentId: exp_001_A

원재료 아이디어
  ↓ 사용성 첨가제 실험 (exp_001_A)
1차 생성물(A)
  ↓ 심미성 첨가제 실험 (exp_001_B)
2차 생성물(B)
  ├─ History: [1차(A), 2차(B)]
  └─ sourceExperimentId: exp_001_B

원재료 아이디어
  ↓ 사용성 첨가제 실험 (exp_001_A)
1차 생성물(A)
  ↓ 심미성 첨가제 실험 (exp_001_B)
2차 생성물(B)
  ↓ 심미성 첨가제 실험 (exp_001_A)
3차 생성물(B)
  ├─ History: [1차(A), 2차(B), 3차(B)]
  └─ sourceExperimentId: exp_001_A
```

## 🔄 작동 흐름

### 1. 실험 저장 (ResultPage.jsx)

```javascript
// 1) 기존 실험 조회
const existingExperiments = await getDocs(experimentsCollectionRef);
const baseNumber = experimentId.replace('exp_', ''); // "001"

// 2) 같은 번호의 변형들 찾기
const existingVariants = existingExperiments
  .filter(id => id.startsWith(`exp_${baseNumber}`))
  .sort();
// 예: ["exp_001_A", "exp_001_B"]

// 3) 다음 알파벳 결정
let suffix = 'A';
if (existingVariants.length > 0) {
  const lastSuffix = existingVariants[existingVariants.length - 1].split('_').pop();
  suffix = String.fromCharCode(lastSuffix.charCodeAt(0) + 1); // A→B, B→C
}

// 4) 최종 ID 생성
const finalExperimentId = `exp_${baseNumber}_${suffix}`;
// 예: "exp_001_B"

// 5) Firebase에 저장
await setDoc(experimentRef, experimentData);

// 6) 생성물의 sourceExperimentId 업데이트
await setDoc(newIdeaRef, { 
  sourceExperimentId: finalExperimentId 
}, { merge: true });
```

### 2. 히스토리 조회 (HistoryList.jsx)

```javascript
// sourceExperimentId로 직접 문서 조회
const experimentRef = doc(
  db, 
  'projects', projectId, 
  'ideas', sourceIdeaId, 
  'experiments', sourceExperimentId  // exp_001_A, exp_001_B 등
);
const experimentDoc = await getDoc(experimentRef);
```

### 3. 삭제 (LabPage.jsx)

```javascript
// 해당 아이디어의 모든 experiments 삭제
const experimentsRef = collection(db, "projects", projectId, "ideas", itemId, "experiments");
const experimentsSnapshot = await getDocs(experimentsRef);

// exp_001_A, exp_001_B, exp_001_C... 모두 삭제
await Promise.all(
  experimentsSnapshot.docs.map(expDoc => deleteDoc(expDoc.ref))
);
```

## ✅ 개선 사항

### 이전 문제점
- 같은 아이디어에서 여러 실험 시 `exp_001`, `exp_002` 형식
- 실험 ID가 순차적으로 증가하여 관계 파악 어려움
- 같은 세대의 다른 실험을 구분하기 힘듦

### 개선 후 장점
1. **명확한 구분**: 같은 아이디어의 실험들이 `exp_001_A`, `exp_001_B`로 명확히 구분
2. **직관적 이해**: 알파벳을 보고 몇 번째 변형인지 즉시 파악 가능
3. **계보 추적 용이**: 첨부 이미지와 같은 복잡한 계보도 정확히 추적
4. **쿼리 최적화**: sourceExperimentId로 특정 실험 직접 조회

## 🧪 테스트 시나리오

### 시나리오 1: 원재료에서 여러 실험
1. `idea_001` (원재료)에서 창의성 첨가제 실험 → `exp_001_A` → `result_idea_001`
2. `idea_001`에서 다시 심미성 첨가제 실험 → `exp_001_B` → `result_idea_002`
3. `idea_001`에서 다시 사용성 첨가제 실험 → `exp_001_C` → `result_idea_003`

**예상 결과:**
- `idea_001`의 experiments: `exp_001_A`, `exp_001_B`, `exp_001_C`
- 각 생성물의 sourceExperimentId가 정확히 매칭

### 시나리오 2: 생성물에서 여러 실험
1. `result_idea_001` (1차)에서 실험 → `exp_001_A` → `result_idea_004` (2차 A)
2. `result_idea_001`에서 다시 실험 → `exp_001_B` → `result_idea_005` (2차 B)
3. `result_idea_005` (2차 B)의 HistoryBtn 클릭

**예상 결과:**
- HistoryList에 [1차, 2차(B)] 표시
- 각 실험의 이미지와 정보 정확히 표시

### 시나리오 3: 3차 생성물 계보 추적
1. `idea_001` → (exp_001_A) → `result_idea_001` (1차)
2. `result_idea_001` → (exp_001_B) → `result_idea_002` (2차 B)
3. `result_idea_002` → (exp_001_A) → `result_idea_003` (3차)
4. `result_idea_003`의 HistoryBtn 클릭

**예상 결과:**
- HistoryList에 [1차, 2차(B), 3차] 표시
- 전체 계보 정확히 추적

## 📝 주의사항

1. **레거시 데이터**: 기존 `exp_001` 형식의 데이터도 호환됨
   - 알파벳 없는 경우 다음 실험은 `B`부터 시작

2. **알파벳 제한**: A-Z까지 26개 변형 지원
   - 한 아이디어에서 26개 이상 실험 시 추가 로직 필요

3. **삭제**: 아이디어 삭제 시 모든 알파벳 변형 함께 삭제
   - 독립성 유지: 다른 생성물은 영향 받지 않음

## 🔍 디버깅 팁

### 콘솔 로그 확인
```javascript
console.log('🔍 기존 실험 변형들:', existingVariants);
console.log('✨ 최종 실험 ID:', finalExperimentId);
console.log('✅ 생성물 sourceExperimentId:', sourceExperimentId);
```

### Firebase 콘솔에서 확인
1. Firestore → projects → {projectId} → ideas
2. 특정 아이디어 클릭 → experiments 서브컬렉션 확인
3. 알파벳 접미사가 올바르게 적용되었는지 확인

### HistoryList 디버깅
```javascript
console.log('📊 실험 목록:', experimentsData.map(e => ({ 
  id: e.id,  // exp_001_A, exp_001_B 등
  generation: e.generation,
  resultIdeaId: e.resultIdeaId
})));
```

## 🎯 결론

알파벳 접미사 시스템을 통해:
- ✅ 첨부 이미지와 같은 복잡한 실험 구조 정확히 구현
- ✅ 같은 세대의 다른 실험 변형 명확히 구분
- ✅ 계보 추적 로직 단순화 및 정확도 향상
- ✅ Firebase 쿼리 최적화

이제 사용자는 한 아이디어에서 다양한 첨가제로 여러 실험을 수행하고,
각 실험의 계보를 정확히 추적할 수 있습니다.

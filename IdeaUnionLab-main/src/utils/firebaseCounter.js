// Firebase 카운터 최적화 유틸리티

import { doc, getDoc, setDoc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

// 카운터 문서 초기화
export async function initializeCounter(counterPath, initialValue = 0) {
  try {
    const counterRef = doc(db, ...counterPath.split('/'));
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await setDoc(counterRef, { count: initialValue });
    }
    
    return true;
  } catch (error) {
    console.error('카운터 초기화 실패:', error);
    return false;
  }
}

// 카운터 증가 및 새 ID 생성
export async function getNextIdWithCounter(counterPath, prefix) {
  try {
    const counterRef = doc(db, ...counterPath.split('/'));
    
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        // 카운터가 없으면 1로 시작
        transaction.set(counterRef, { count: 1 });
        return 1;
      } else {
        // 카운터 증가
        const newCount = counterDoc.data().count + 1;
        transaction.update(counterRef, { count: newCount });
        return newCount;
      }
    });
    
    // ID 생성
    const newId = `${prefix}_${String(result).padStart(3, '0')}`;
    return { id: newId, count: result };
    
  } catch (error) {
    console.error('카운터 증가 실패:', error);
    // 실패 시 현재 시간 기반 ID 생성
    const timestamp = Date.now();
    return { 
      id: `${prefix}_${timestamp}`, 
      count: null 
    };
  }
}

// 카운터 감소 (삭제 시)
export async function decrementCounter(counterPath) {
  try {
    const counterRef = doc(db, ...counterPath.split('/'));
    await updateDoc(counterRef, {
      count: increment(-1)
    });
    return true;
  } catch (error) {
    console.error('카운터 감소 실패:', error);
    return false;
  }
}

// 현재 카운터 값 조회 (빠른 조회)
export async function getCounterValue(counterPath) {
  try {
    const counterRef = doc(db, ...counterPath.split('/'));
    const counterDoc = await getDoc(counterRef);
    
    if (counterDoc.exists()) {
      return counterDoc.data().count || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('카운터 조회 실패:', error);
    return 0;
  }
}

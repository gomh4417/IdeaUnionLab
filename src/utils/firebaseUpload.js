// firebaseUpload.js - Firebase Storage의 upload 폴더에서 이미지 목록 가져오기
import { storage } from '../firebase';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

/**
 * upload 폴더에서 최근 10개의 이미지 URL을 가져옵니다
 * @returns {Promise<Array>} 이미지 URL 배열 (최신순)
 */
export const getRecentUploadedImages = async () => {
  try {
    const uploadRef = ref(storage, 'upload');
    const result = await listAll(uploadRef);

    if (result.items.length === 0) {
      console.log('📁 upload 폴더에 이미지가 없습니다');
      return [];
    }

    // 각 파일의 메타데이터와 URL을 가져옵니다
    const imagePromises = result.items.map(async (itemRef) => {
      try {
        const metadata = await getMetadata(itemRef);
        const url = await getDownloadURL(itemRef);
        
        return {
          url,
          name: itemRef.name,
          timeCreated: metadata.timeCreated,
          timestamp: new Date(metadata.timeCreated).getTime(),
        };
      } catch (error) {
        console.error('이미지 정보 가져오기 실패:', itemRef.name, error);
        return null;
      }
    });

    const images = (await Promise.all(imagePromises)).filter(Boolean);

    // 최신순으로 정렬하고 상위 10개만 반환
    const sortedImages = images
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    console.log(`✅ ${sortedImages.length}개의 업로드 이미지를 찾았습니다`);
    return sortedImages;

  } catch (error) {
    console.error('❌ 업로드 이미지 목록 가져오기 실패:', error);
    return [];
  }
};

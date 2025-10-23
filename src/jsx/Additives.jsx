import styled from 'styled-components';
import { theme } from '../styles/theme';

const ICONS = {
    creativity: '/creativity.svg',
    aesthetics: '/aesthetics.svg',
    usability: '/usability.svg',
};

const TITLES = {
    creativity: '창의성 첨가제',
    aesthetics: '심미성 첨가제',
    usability: '사용성 첨가제',
};

const DESCS = {
    creativity: '아이디어 변형 및 재구성',
    aesthetics: '무드보드, 레퍼런스 활용',
    usability: '시나리오 기반 문제 개선',
};

const ACTIVE_COLORS = {
    creativity: theme.colors.brand[3],
    aesthetics: theme.colors.brand[1],
    usability: theme.colors.brand[2],
};

const ItemWrap = styled.div`
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 236px;
    max-height: 200px;
    transform: translateX(-14px);
    border-left: 4px solid transparent;
    background: ${({ $active, $color }) => $active ? `${$color}10` : 'transparent'};
    transition: all 1s ease-in-out;
    cursor: pointer;
    margin-bottom: 8px;
    
    border-left: ${({ $active, $color }) => $active ? `4px solid ${$color}` : '4px solid transparent'};
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    height: 64px;
`;

const IconBox = styled.div`
    width: 48px;
    height: 48px;
    border-radius: ${theme.radius.medium};
    background: ${({ $active, $color }) => $active ? `${$color}10` : theme.colors.gray[200]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
`;

const IconImg = styled.img`
    width: 100%;
    height: 100%;
`;

const TextWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Name = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${theme.colors.gray[900]};
    line-height: 140%;
`;

const Desc = styled.div`
    font-size: 12px;
    font-weight: 400;
    color: ${theme.colors.gray[500]};
    line-height: 140%;
`;

const ExpandImgBox = styled.div`
    width: 204px;
    height: 112px;
    border-radius: ${theme.radius.large};
    background: ${({ $color }) => $color ? `${$color}22` : theme.colors.gray[100]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 12px 14px;
    overflow: hidden;
`;

const ExpandImg = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain;
`;

export default function Additives({ type, active, onClick, referenceImage, setReferenceImage, onOpenImageModal }) {
    // 업로드 박스 클릭 시 Firebase Storage 이미지 모달 열기
    const handleUploadBoxClick = (e) => {
        e.stopPropagation(); // 부모 onClick 방지
        if (onOpenImageModal) {
            onOpenImageModal();
        }
    };

    return (
        <ItemWrap $active={active} $color={ACTIVE_COLORS[type]} onClick={onClick} style={{height: active ? 272 : 64, transition: 'height 0.6s'}}>
            <Row>
                <IconBox $active={active} $color={ACTIVE_COLORS[type]}>
                    <IconImg src={ICONS[type]} alt={TITLES[type]} />
                </IconBox>
                <TextWrap>
                    <Name>{TITLES[type]}</Name>
                    <Desc>{DESCS[type]}</Desc>
                </TextWrap>
            </Row>
            {active && (
                type === 'aesthetics' ? (
                    <ExpandImgBox $color={ACTIVE_COLORS[type]} style={{border: '1px dashed #a1a1a1', background: '#fff'}}>
                        {referenceImage ? (
                            <ExpandImg src={referenceImage} alt="업로드 이미지" />
                        ) : (
                            <UploadBox $color={ACTIVE_COLORS[type]} onClick={handleUploadBoxClick}>
                                <UploadIcon className="material-symbols-outlined">upload</UploadIcon>
                                <UploadText>레퍼런스 이미지를 선택해주세요</UploadText>
                            </UploadBox>
                        )}
                    </ExpandImgBox>
                ) : (
                    <ExpandImgBox $color={ACTIVE_COLORS[type]}>
                        <ExpandImg
                            src={
                                type === 'creativity'
                                    ? '/CreativityImg.png'
                                    : type === 'usability'
                                    ? '/UsabilityImg.png'
                                    : ''
                            }
                            alt={TITLES[type]}
                        />
                    </ExpandImgBox>
                )
            )}
        </ItemWrap>
    );
}

// 업로드 박스 스타일
const UploadBox = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    background: ${({ $color }) => $color ? `${$color}10` : 'transparent'};
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
`;

const UploadIcon = styled.span`
    font-family: 'Material Symbols Outlined', sans-serif;
    font-size: 24px;
    width: 24px;
    height: 24px;
    color: #a1a1a1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const UploadText = styled.span`
    font-size: 12px;
    font-weight: 400;
    line-height: 140%;
    color: #cccccc;
`;

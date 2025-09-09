import Additives from './Additives';

const ADDITIVE_TYPES = [
  'creativity',
  'aesthetics',
  'usability',
];

const ListWrap = {
  maxHeight: 344,
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
};

export default function AdditiveList({ selectedAdditive, setSelectedAdditive, referenceImage, setReferenceImage }) {
  return (
    <div style={ListWrap}>
      {ADDITIVE_TYPES.map(type => (
        <Additives
          key={type}
          type={type}
          active={selectedAdditive === type}
          onClick={() => setSelectedAdditive(type === selectedAdditive ? null : type)}
          referenceImage={type === 'aesthetics' ? referenceImage : null}
          setReferenceImage={type === 'aesthetics' ? setReferenceImage : null}
        />
      ))}
    </div>
  );
}

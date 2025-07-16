import styled from 'styled-components';

const StyledButton = styled.button`
  width: 216px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radius.large};
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: ${({ theme }) => theme.shadow};
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default function Button({ children, ...props }) {
  return <StyledButton {...props}>{children}</StyledButton>;
}

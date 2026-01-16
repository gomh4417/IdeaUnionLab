import styled from 'styled-components';

const StyledButton = styled.button`
    width: 260px;
    height: 68px;
    border-radius: ${({ theme }) => theme.radius.large};
    background: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadow};
    color: #fff;
    font-size: 22px;
    font-weight: 600;
    line-height: 24px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    margin-top: 624px;
`;

export default function StartButton({ children, ...props }) {
    return <StyledButton {...props}>{children}</StyledButton>;
}

import styled from 'styled-components';

export const Form = styled.form`
  max-width: 600px;
  margin: 0 auto;
  padding: 6rem 1rem 1rem; /* padding to account for the fixed header */
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 5px;
  border: 1px solid #ced4da;
  outline: none;
`;

export const LoginButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #ffffff;
  cursor: pointer;
`;

export const RegisterButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: #ffffff;
  cursor: pointer;
  float: right;
`;

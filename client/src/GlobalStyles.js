import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  body {
    // font-family: 'Arial', sans-serif;
    background-color: #f8f9fa;
    color: #343a40;
    margin: 0;
    padding: 0;
  }

  * {
    box-sizing: border-box;
  }

  h3 {
    margin-bottom: 0.5rem;
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

export default GlobalStyles;

import { css } from 'lit';

/**
 * Shared styles for media info formatting.
 */
export const sharedStylesMediaInfo = css`

  .media-info-content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    width: 100%;
    gap: 0.5rem;
    margin: 0.25rem;
  }

  .media-info-content > div {
    flex: 1 1 auto;
    min-width: 0;
  }

  .media-info-content .img {
    background-size: contain !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 8px !important;
    object-fit: contain;
  }

  .media-info-description {
    overflow-y: auto;
    scrollbar-color: #4d4d4d #121212;
    scrollbar-width: thin;
    display: block;
    height: inherit;  
    padding-top: 0.5rem;
    color: #b3b3b3;
  }

  .media-info-details {
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    max-width: 100%;
    margin: 0.5rem;
  }

  .media-info-text-l {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
    padding-bottom: 0.5rem;
    width: 100%;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .media-info-text-ms, .media-info-text-ms-c {
    font-size: 1rem;
    line-height: 1.4;
    padding-bottom: 0.25rem;
    width: 100%;
    color: #b3b3b3;
  }

  .media-info-text-ms-c {
    color: #1DB954;
  }

  .media-info-text-m {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    padding-bottom: 0.5rem;
    width: 100%;
    color: #ffffff;
  }

  .media-info-text-s {
    font-size: 0.8rem;
    line-height: 1.3;
    width: 100%;
    color: #b3b3b3;
  }

  ha-icon-button[slot="media-info-icon-link-s"] {
    --mdc-icon-button-size: 14px;
    --mdc-icon-size: 14px;
    padding-left: 2px;
    padding-right: 2px;
  }

`;

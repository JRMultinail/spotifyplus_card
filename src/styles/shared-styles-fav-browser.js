import { css } from 'lit';

/**
 * Shared styles for favorites browsers.
 * 
 * See the following link for more information:
 * https://codepen.io/neoky/pen/mGpaKN
 */
export const sharedStylesFavBrowser = css`

  .media-browser-section {
    color: #b3b3b3;
    background-color: #121212;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-radius: 8px;
  }

  .media-browser-section-title {
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    font-weight: 700;
    font-size: var(--spc-media-browser-section-title-font-size, 1.25rem);
    line-height: 1.3;
    color: var(--spc-media-browser-section-title-color, #ffffff);
    letter-spacing: -0.01em;
  }

  .media-browser-section-subtitle {
    padding: 0.25rem 1rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    font-weight: 400;
    font-size: var(--spc-media-browser-section-subtitle-font-size, 0.875rem);
    line-height: 1.3;
    color: var(--spc-media-browser-section-subtitle-color, #b3b3b3);
  }

  .media-browser-controls {
    padding: 0.5rem 1rem;
    white-space: nowrap;
    --ha-select-height: 2.5rem;
    --mdc-menu-item-height: 2.5rem;
    --mdc-icon-button-size: 2.5rem;
    --md-menu-item-top-space: 0.5rem;
    --md-menu-item-bottom-space: 0.5rem;
    --md-menu-item-one-line-container-height: 2.0rem;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    flex-direction: row;
    gap: 0.5rem;
  }

  .media-browser-control-filter {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
    width: 100%;
  }

  .media-browser-control-filter-disabled {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
    width: 100%;
    align-self: center;
    color: #1DB954;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .media-browser-content {
    margin: 0.5rem;
    flex: 3;
    max-height: 100vh;
    overflow-y: auto;
    scrollbar-color: #4d4d4d #121212;
    scrollbar-width: thin;
    border-radius: 8px;
  }

  .media-browser-content::-webkit-scrollbar {
    width: 8px;
  }

  .media-browser-content::-webkit-scrollbar-track {
    background: #121212;
  }

  .media-browser-content::-webkit-scrollbar-thumb {
    background-color: #4d4d4d;
    border-radius: 4px;
  }

  .media-browser-list {
    height: 100%;
  }

  .media-browser-actions {
    height: 100%;
  }

  ha-alert {
    display: block;
    margin-bottom: 0.25rem;
  }

  *[hide] {
    display: none;
  }

`;

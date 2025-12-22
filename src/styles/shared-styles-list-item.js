// Shared list item styles used across queue, search results, and other list views.
// Matches the YouTube Music style list item design.
import { css } from 'lit';

export const sharedStylesListItem = css`
  .list-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    gap: 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
    background: transparent;
  }

  .list-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .list-item-artwork {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 4px;
    background-size: cover;
    background-position: center;
    background-color: transparent;
    background-repeat: no-repeat;
  }

  .list-item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .list-item-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-item-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .list-item-action {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 20px;
    color: rgba(255, 255, 255, 0.5);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .list-item:hover .list-item-action {
    opacity: 1;
  }

  .list-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.875rem;
    background: transparent;
  }
`;

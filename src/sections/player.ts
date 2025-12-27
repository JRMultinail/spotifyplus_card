// lovelace card imports.
import { css, html, TemplateResult } from 'lit';
import { customElement, property, state } from "lit/decorators.js";
import { styleMap, StyleInfo } from 'lit-html/directives/style-map.js';
import { mdiChevronDown, mdiPlaylistMusic } from '@mdi/js';

// our imports - card components.
import '../components/player-body-queue';
import '../components/player-controls';
import '../components/player-volume';
import '../components/player-progress';

// our imports.
import {
  BRAND_LOGO_IMAGE_BASE64,
  BRAND_LOGO_IMAGE_SIZE,
  PLAYER_CONTROLS_ICON_SIZE_DEFAULT
} from '../constants';
import { CardConfig } from '../types/card-config';
import { MediaPlayer } from '../model/media-player';
import { AlertUpdatesBase } from './alert-updates-base';


@customElement("spc-player")
export class Player extends AlertUpdatesBase {

  // public state properties.
  @property({ attribute: false }) mediaContentId!: string;
  @property({ attribute: false }) playerExpanded: boolean = true;

  // private storage.
  @state() private config!: CardConfig;

  /** MediaPlayer instance created from the configuration entity id. */
  private player!: MediaPlayer;

  /**
   * Handle minimize button click - navigate away from fullscreen player
   */
  private onMinimizeClick(): void {
    // Dispatch minimize event - card.ts will find the first available non-Player section
    this.dispatchEvent(new CustomEvent('minimize-player', {
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Get the album artwork URL
   */
  private getArtworkUrl(): string {
    const playerImage = this.player.attributes.entity_picture || this.player.attributes.entity_picture_local;
    if (playerImage) {
      const baseUrl = this.store.hass.hassUrl(playerImage);
      const mediaContentId = this.player.attributes.media_content_id;
      if (!mediaContentId) {
        return baseUrl;
      }
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}spc_cache=${encodeURIComponent(mediaContentId)}`;
    }
    return '';
  }

  /**
   * Returns a key that changes when the playing track changes so the queue refreshes.
   */
  private getQueueRefreshId(): string {
    const mediaContentId = this.player.attributes.media_content_id || '';
    const trackUri = this.player.attributes.sp_track_uri_origin || '';
    const playlistUri = this.player.attributes.sp_playlist_uri || '';
    const title = this.player.attributes.media_title || '';
    const artist = this.player.attributes.media_artist || '';
    if (trackUri) {
      return `${mediaContentId}|${trackUri}`;
    }
    if (playlistUri) {
      return `${mediaContentId}|${playlistUri}`;
    }
    if (title || artist) {
      return `${mediaContentId}|${title}|${artist}`;
    }
    return mediaContentId;
  }

  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // set common references from application common storage area.
    this.config = this.store.config;
    this.player = this.store.player;

    // get idle state in case we are minimizing height.
    const isOffIdle = this.player.isPoweredOffOrIdle();

    // Get artwork URL for the left panel
    const artworkUrl = this.getArtworkUrl();

    // Get track info
    const trackTitle = this.player.attributes.media_title || 'No Media Playing';
    const artistName = this.player.attributes.media_artist || '';
    const mediaContentId = this.player.attributes.media_content_id || '';
    const queueRefreshId = this.getQueueRefreshId();

    // Check if queue should be hidden
    const hideQueue = this.config.playerControlsHidePlayQueue || false;

    // render html.
    return html`
      <div class="player-section-container" style=${this.stylePlayerSection()}>
        <!-- Left Panel: Artwork, Track Info, Controls -->
        <div class="player-left-panel">
          <!-- Minimize button -->
          <div class="player-minimize-btn" @click=${() => this.onMinimizeClick()}>
            <ha-icon-button .path=${mdiChevronDown}></ha-icon-button>
          </div>
          
          <!-- Album Artwork -->
          <div class="player-artwork-container">
            <div class="player-artwork-blur" style=${this.styleArtworkBlur(artworkUrl)}></div>
            <div class="player-artwork" style=${this.styleArtwork(artworkUrl)}></div>
          </div>
          
          <!-- Track Info -->
          <div class="player-track-info">
            <div class="player-track-title">${trackTitle}</div>
            <div class="player-track-artist">${artistName}</div>
          </div>
          
          <!-- Progress Bar -->
          <div class="player-progress-container">
            <spc-player-progress .store=${this.store}></spc-player-progress>
          </div>
          
          <!-- Playback Controls -->
          <div class="player-controls-container">
            <spc-player-controls 
              class="player-controls-inline"
              .store=${this.store}
              .mediaContentId=${mediaContentId}
              .hideQueue=${true}
            ></spc-player-controls>
          </div>
          
          <!-- Alerts -->
          <div class="player-alert-bgcolor">
            ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
            ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
          </div>
        </div>
        
        <!-- Right Panel: Queue -->
        ${!hideQueue ? html`
          <div class="player-right-panel">
            <div class="player-queue-header">
              <span class="player-queue-title">UP NEXT</span>
              <ha-icon-button 
                .path=${mdiPlaylistMusic}
                label="Queue"
                class="player-queue-button"
              ></ha-icon-button>
            </div>
            <div class="player-queue-content">
                  ${(() => {
          if (isOffIdle && this.config.playerMinimizeOnIdle && this.config.height != "fill") {
            return html`<div class="player-queue-empty">Player is idle</div>`;
          } else if (this.player.attributes.sp_item_type == 'track' ||
            this.player.attributes.sp_item_type == 'podcast' ||
            this.player.attributes.sp_item_type == 'audiobook') {
            return html`<spc-player-body-queue 
                    class="player-queue-list" 
                    .store=${this.store} 
                    .mediaContentId=${queueRefreshId} 
                    id="elmPlayerBodyQueue"
                  ></spc-player-body-queue>`;
          } else {
            return html`<div class="player-queue-empty">No items in queue</div>`;
          }
        })()}
            </div>
          </div>
        ` : html``}
      </div>
    `;
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {

    return css`

      .hoverable:focus,
      .hoverable:hover {
        color: #1DB954;
        transform: scale(1.05);
      }

      .hoverable:active {
        color: #1ed760;
        transform: scale(0.95);
      }

      /* Main container - two column layout for tablet */
      .player-section-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100%;
        width: 100%;
        background-color: var(--spc-player-palette-darkmuted, #121212);
        border-radius: 12px;
        overflow: hidden;
        position: relative;
      }

      /* Left panel - artwork and controls - uses album art derived color */
      .player-left-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--spc-player-palette-muted, var(--spc-player-palette-darkmuted, #1a1a1a)) 60%, black) 0%,
          color-mix(in srgb, var(--spc-player-palette-muted, var(--spc-player-palette-darkmuted, #1a1a1a)) 40%, black) 100%
        );
      }

      /* Minimize button - top left corner */
      .player-minimize-btn {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 10;
        color: #ffffff;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s ease, transform 0.2s ease;
        --mdc-icon-button-size: 40px;
        --mdc-icon-size: 28px;
      }

      .player-minimize-btn:hover {
        opacity: 1;
        color: #1DB954;
        transform: scale(1.1);
      }

      .player-minimize-btn ha-icon-button {
        color: inherit;
      }

      /* Artwork container with blurred background */
      .player-artwork-container {
        position: relative;
        width: 100%;
        max-width: 400px;
        aspect-ratio: 1 / 1;
        margin: 2rem 0 1rem 0;
        border-radius: 8px;
        overflow: hidden;
      }

      /* Blurred background behind artwork */
      .player-artwork-blur {
        position: absolute;
        inset: -30px;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(40px) saturate(1.4) brightness(0.5);
        transform: scale(1.2);
        z-index: 0;
      }

      /* Main artwork image */
      .player-artwork {
        position: relative;
        width: 100%;
        height: 100%;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 1;
        border-radius: 8px;
      }

      /* Track info section */
      .player-track-info {
        width: 100%;
        max-width: 400px;
        text-align: left;
        padding: 1rem 0 0.5rem;
        z-index: 1;
      }

      .player-track-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #ffffff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 0.25rem;
      }

      .player-track-artist {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Progress bar container */
      .player-progress-container {
        width: 100%;
        max-width: 400px;
        padding: 0.5rem 0;
        z-index: 1;
      }

      /* Controls container */
      .player-controls-container {
        width: 100%;
        max-width: 400px;
        padding: 0.5rem 0;
        z-index: 1;
      }

      .player-controls-inline {
        --spc-player-controls-bg-color: transparent;
      }

      /* Right panel - queue - uses darker version of album art color */
      .player-right-panel {
        display: flex;
        flex-direction: column;
        background: color-mix(in srgb, var(--spc-player-palette-muted, var(--spc-player-palette-darkmuted, #1a1a1a)) 35%, black);
        border-left: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .player-queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: color-mix(in srgb, var(--spc-player-palette-muted, var(--spc-player-palette-darkmuted, #1a1a1a)) 30%, black);
      }

      .player-queue-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 0.05em;
      }

      .player-queue-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
        color: rgba(255, 255, 255, 0.7);
      }

      .player-queue-button:hover {
        color: #ffffff;
      }

      .player-queue-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: #4d4d4d transparent;
      }

      .player-queue-content::-webkit-scrollbar {
        width: 8px;
      }

      .player-queue-content::-webkit-scrollbar-track {
        background: transparent;
      }

      .player-queue-content::-webkit-scrollbar-thumb {
        background: #4d4d4d;
        border-radius: 4px;
      }

      .player-queue-list {
        display: block;
        padding: 0.5rem 0;
      }

      .player-queue-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.875rem;
      }

      /* Alert styling */
      .player-alert-bgcolor {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        background-color: rgba(18, 18, 18, 0.95);
        border-radius: 8px;
        z-index: 100;
      }

      /* Responsive: single column on smaller screens */
      @media (max-width: 768px) {
        .player-section-container {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr auto;
        }

        .player-right-panel {
          max-height: 40%;
          border-left: none;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .player-artwork-container {
          max-width: 280px;
          margin: 1rem 0;
        }

        .player-track-info,
        .player-progress-container,
        .player-controls-container {
          max-width: 280px;
        }
      }

    `;
  }

  /**
   * Returns a style for the artwork blur background.
   */
  private styleArtworkBlur(artworkUrl: string) {
    const styleInfo: StyleInfo = <StyleInfo>{};
    if (artworkUrl) {
      styleInfo['background-image'] = `url(${artworkUrl})`;
    }
    return styleMap(styleInfo);
  }

  /**
   * Returns a style for the main artwork.
   */
  private styleArtwork(artworkUrl: string) {
    const styleInfo: StyleInfo = <StyleInfo>{};
    if (artworkUrl) {
      styleInfo['background-image'] = `url(${artworkUrl})`;
    } else {
      styleInfo['background-image'] = `url(${BRAND_LOGO_IMAGE_BASE64})`;
      styleInfo['background-size'] = BRAND_LOGO_IMAGE_SIZE;
    }
    return styleMap(styleInfo);
  }


  /**
   * Returns an element style for the player section.
   */
  private stylePlayerSection() {

    // build style info object.
    const styleInfo: StyleInfo = <StyleInfo>{};

    // get current media player image for background color extraction
    let playerImage: string | undefined = undefined;
    if (this.store.player) {
      playerImage = (this.store.player.attributes.entity_picture || this.store.player.attributes.entity_picture_local);
      if (playerImage) {
        playerImage = this.store.hass.hassUrl(playerImage);
      }
    }

    // Store player image for vibrant color extraction
    this.store.card.playerImage = playerImage;
    this.store.card.playerMediaContentId = this.store.player.attributes.media_content_id;

    // set player controls and volume controls icon size.
    const playerControlsIconSize = this.config.playerControlsIconSize || PLAYER_CONTROLS_ICON_SIZE_DEFAULT;
    const playerControlsIconColor = this.config.playerControlsIconColor;
    const playerControlsIconToggleColor = this.config.playerControlsIconToggleColor;
    const playerProgressSliderColor = this.config.playerProgressSliderColor;
    const playerProgressLabelColor = this.config.playerProgressLabelColor;
    const playerVolumeSliderColor = this.config.playerVolumeSliderColor;

    // build style info object for controls.
    if (playerControlsIconToggleColor)
      styleInfo['--spc-player-controls-icon-toggle-color'] = `${playerControlsIconToggleColor}`;
    if (playerControlsIconColor)
      styleInfo['--spc-player-controls-icon-color'] = `${playerControlsIconColor}`;
    if (playerControlsIconSize)
      styleInfo['--spc-player-controls-icon-size'] = `${playerControlsIconSize}`;
    styleInfo['--spc-player-controls-icon-button-size'] = `calc(var(--spc-player-controls-icon-size, ${PLAYER_CONTROLS_ICON_SIZE_DEFAULT}) + 0.75rem)`;
    if (playerProgressLabelColor)
      styleInfo['--spc-player-progress-label-color'] = `${playerProgressLabelColor}`;
    if (playerProgressSliderColor)
      styleInfo['--spc-player-progress-slider-color'] = `${playerProgressSliderColor}`;
    if (playerVolumeSliderColor)
      styleInfo['--spc-player-volume-slider-color'] = `${playerVolumeSliderColor}`;

    return styleMap(styleInfo);

  }

}

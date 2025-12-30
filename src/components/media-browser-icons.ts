// lovelace card imports.
import { css, html, TemplateResult } from 'lit';

// our imports.
import { ITEM_SELECTED } from '../constants';
import { MediaBrowserBase } from './media-browser-base';
import { IMediaBrowserItem } from '../types/media-browser-item';
import { Section } from '../types/section';
import { customEvent, formatStringProperCase } from '../utils/utils';


export class MediaBrowserIcons extends MediaBrowserBase {


  /**
   * Initializes a new instance of the class.
   */
  constructor() {

    // invoke base class method.
    super();
  }


  /**
   * Invoked on each update to perform rendering tasks. 
   * This method may return any value renderable by lit-html's `ChildPart` (typically a `TemplateResult`). 
   * Setting properties inside this method will *not* trigger the element to update.
  */
  protected render(): TemplateResult | void {

    // invoke base class method.
    super.render();

    // render html.
    return html`
      <div class="icons" style=${this.styleMediaBrowser()}>
        ${this.buildMediaBrowserItems().map((item, index) => html`
          ${this.styleMediaBrowserItemBackgroundImage(item.mbi_item.image_url, index)}
          ${(() => {
            const isDevice = this.mediaItemType === Section.DEVICES;

            // Always render both touch and mouse handlers to support hybrid devices
            // (PCs with touchscreens that also use mouse, tablets with keyboard/mouse, etc.)
            return (html`
              <ha-control-button
                class="button"
                isTouchDevice="${this.isTouchDevice}"
                @touchstart=${{handleEvent: () => this.onMediaBrowserItemTouchStart(customEvent(ITEM_SELECTED, item)), passive: true }}
                @touchend=${() => this.onMediaBrowserItemTouchEnd(customEvent(ITEM_SELECTED, item))}
                @click=${() => this.onMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
                @mousedown=${() => this.onMediaBrowserItemMouseDown()}
                @mouseup=${() => this.onMediaBrowserItemMouseUp(customEvent(ITEM_SELECTED, item))}
              >
                ${this.renderMediaBrowserItem(item, !item.mbi_item.image_url || !this.hideTitle, !this.hideSubTitle, isDevice)}
              </ha-control-button>
            `);
          })()}
        `)}
      </div>
    `;
  }


  /**
   * Render the media item.
  */
  protected renderMediaBrowserItem(
    item: IMediaBrowserItem,
    showTitle: boolean = true,
    showSubTitle: boolean = true,
    isDevice: boolean = false,
  ) {

    let clsActive = ''
    let divNowPlayingBars = html``

    // For devices, show playing bars based on is_playing flag.
    // For other items, show playing bars when is_active.
    const showBars = isDevice ? item.mbi_item.is_playing : item.mbi_item.is_active;
    if (showBars) {
      divNowPlayingBars = this.nowPlayingBars;
    }

    if (item.mbi_item.is_active) {
      clsActive = ' title-active';
    }

    // For devices, show a status indicator (empty circle or green tick) in the top-left corner.
    const deviceIndicator = isDevice
      ? html`<div class="device-status ${item.mbi_item.is_active ? 'device-active' : ''}">
          ${item.mbi_item.is_active
            ? html`<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
            : html`<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`
          }
        </div>`
      : html``;

    return html`
      <div class="thumbnail">
        ${deviceIndicator}
        ${divNowPlayingBars}
      </div>
      <div class="title${clsActive}" ?hidden=${!showTitle}>
        ${item.mbi_item.title}
        <div class="subtitle" ?hidden=${!showSubTitle}>${formatStringProperCase(item.mbi_item.subtitle || '')}</div>
      </div>
    `;
  }


  /**
   * Style definitions used by this card section.
   * 
   * --control-button-padding: 0px;   // image with rounded corners
   */
  static get styles() {
    return [
      css`
        .icons {
          display: flex;
          flex-wrap: wrap;
        }

        .button {
          --control-button-padding: 0px;
          --margin: 0.6%;
          --width: calc(100% / var(--items-per-row) - (var(--margin) * 2));
          width: var(--width);
          height: var(--width);
          margin: var(--margin);
        }

        .thumbnail {
          width: 100%;
          padding-bottom: 100%;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center;
          mask-repeat: no-repeat;
          mask-position: center;
          position: relative;
        }

        /* Device status indicator styles */
        .device-status {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
        }

        .device-status svg {
          width: 16px;
          height: 16px;
          fill: var(--secondary-text-color, #888);
        }

        .device-status.device-active svg {
          fill: var(--success-color, #4caf50);
        }

        .title {
          color: var(--spc-media-browser-items-color, #ffffff);
          font-size: var(--spc-media-browser-items-title-font-size, 0.8rem);
          font-weight: normal;
          line-height: 160%;
          padding: 0.75rem 0.5rem 0rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          position: absolute;
          width: 100%;
          bottom: 0;
          background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.6));
        }

        .title-active {
          color: var(--spc-media-browser-items-color, #ffffff);
        }

        .subtitle {
          font-size: var(--spc-media-browser-items-subtitle-font-size, 0.8rem);
          line-height: 120%;
          width: 100%;
          padding-bottom: 0.25rem;
        }

        /* *********************************************************** */
        /* the remaining styles are used for the sound animation icon. */
        /* *********************************************************** */
        .bars {
          position: absolute;
          width: 20px;
          height: 10px;
          margin-top: 20px;
          margin-left: 10px;

          /*height: 30px;*/
          /*left: 10%;*/
          /*margin: 0 0 0 0;*/
          /*position: absolute;*/
          /*top: -4%;*/
          /*width: 40px;*/
        }

        .bar {
          background: var(--dark-primary-color);
          bottom: 1px;
          height: 3px;
          position: absolute;
          width: 3px;      
          animation: sound 0ms -800ms linear infinite alternate;
          display: block;
        }

        @keyframes sound {
          0% {
            opacity: .35;
            height: 3px; 
          }
          100% {
            opacity: 1;       
            height: 1rem;        
          }
        }

        .bar:nth-child(1)  { left: 1px; animation-duration: 474ms; }
        .bar:nth-child(2)  { left: 5px; animation-duration: 433ms; }
        .bar:nth-child(3)  { left: 9px; animation-duration: 407ms; }
        .bar:nth-child(4)  { left: 13px; animation-duration: 458ms; }
        /*.bar:nth-child(5)  { left: 17px; animation-duration: 400ms; }*/
        /*.bar:nth-child(6)  { left: 21px; animation-duration: 427ms; }*/
        /*.bar:nth-child(7)  { left: 25px; animation-duration: 441ms; }*/
        /*.bar:nth-child(8)  { left: 29px; animation-duration: 419ms; }*/
        /*.bar:nth-child(9)  { left: 33px; animation-duration: 487ms; }*/
        /*.bar:nth-child(10) { left: 37px; animation-duration: 442ms; }*/

      `,
    ];
  }
}

customElements.define('spc-media-browser-icons', MediaBrowserIcons);

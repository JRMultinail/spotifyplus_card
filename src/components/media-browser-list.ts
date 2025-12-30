// lovelace card imports.
import { css, html, TemplateResult } from 'lit';
import { when } from 'lit/directives/when.js';

// our imports.
import {
  listStyle,
  ITEM_SELECTED
} from '../constants';
import { MediaBrowserBase } from './media-browser-base';
import { IMediaBrowserItem } from '../types/media-browser-item';
import { Section } from '../types/section';
import { customEvent, formatStringProperCase } from '../utils/utils';


export class MediaBrowserList extends MediaBrowserBase {

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
      <mwc-list multi class="list" style=${this.styleMediaBrowser()}">
        ${this.buildMediaBrowserItems().map((item, index) => {
          return html`
            ${this.styleMediaBrowserItemBackgroundImage(item.mbi_item.image_url, index)}
            ${(() => {
              // Determine if playing bars should be shown.
              // For devices, use is_playing (set on the item). For other items, use is_active && isPlaying().
              const isDevice = this.mediaItemType === Section.DEVICES;
              const showBars = isDevice ? item.mbi_item.is_playing : (item.mbi_item.is_active && this.store.player.isPlaying());

              // Always render both touch and mouse handlers to support hybrid devices
              // (PCs with touchscreens that also use mouse, tablets with keyboard/mouse, etc.)
              return (html`
                <mwc-list-item
                  hasMeta
                  class="${this.listItemClass}"
                  @touchstart=${{handleEvent: () => this.onMediaBrowserItemTouchStart(customEvent(ITEM_SELECTED, item)), passive: true }}
                  @touchend=${() => this.onMediaBrowserItemTouchEnd(customEvent(ITEM_SELECTED, item))}
                  @click=${() => this.onMediaBrowserItemClick(customEvent(ITEM_SELECTED, item))}
                  @mousedown=${() => this.onMediaBrowserItemMouseDown()}
                  @mouseup=${() => this.onMediaBrowserItemMouseUp(customEvent(ITEM_SELECTED, item))}
                >
                  <div class="row">${this.renderMediaBrowserItem(item, !item.mbi_item.image_url || !this.hideTitle, !this.hideSubTitle, isDevice)}</div>
                  ${when(showBars, () => html`${this.nowPlayingBars}`)}
                </mwc-list-item>
              `);
            })()}
          `;
        })}
      </mwc-list>
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
    if (item.mbi_item.is_active) {
      clsActive = ' title-active';
    }

    // For devices, show a status indicator (empty circle or green tick).
    const deviceIndicator = isDevice
      ? html`<div class="device-status ${item.mbi_item.is_active ? 'device-active' : ''}">
          ${item.mbi_item.is_active
            ? html`<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
            : html`<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>`
          }
        </div>`
      : html``;

    return html`
      ${deviceIndicator}
      <div class="thumbnail"></div>
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
        :host {
          --spc-media-browser-list-scale: 0.5;
        }

        .button {
          --control-button-padding: 0px;
          --icon-width: calc(var(--spc-media-browser-list-scale, 1) * 94px);
          height: var(--icon-width);
          margin: calc(var(--spc-media-browser-list-scale, 1) * 0.4rem) 0.0rem;
        }

        .button-device {
          --icon-width: calc(var(--spc-media-browser-list-scale, 1) * 50px) !important;
          margin: calc(var(--spc-media-browser-list-scale, 1) * 0.1rem) 0 !important;
        }

        .button-track {
          --icon-width: calc(var(--spc-media-browser-list-scale, 1) * 80px) !important;
          margin: calc(var(--spc-media-browser-list-scale, 1) * 0.1rem) 0 !important;
          padding: calc(var(--spc-media-browser-list-scale, 1) * 0.25rem);
        }

        .row {
          display: flex;
          align-items: center;
        }

        /* Device status indicator styles */
        .device-status {
          width: 20px;
          height: 20px;
          min-width: 20px;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .device-status svg {
          width: 18px;
          height: 18px;
          fill: var(--secondary-text-color, #888);
        }

        .device-status.device-active svg {
          fill: var(--success-color, #4caf50);
        }

        .thumbnail {
          width: var(--icon-width);
          height: var(--icon-width);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
          mask-repeat: no-repeat;
          mask-position: left;
          border-radius: 0.5rem;
        }

        .title {
          color: var(--spc-media-browser-items-list-color, var(--spc-media-browser-items-color, var(--primary-text-color, #ffffff)));
          font-size: var(--spc-media-browser-items-title-font-size, 1.1rem);
          font-weight: normal;
          padding: 0 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          align-self: center;
          flex: 1;
        }

        .title-active {
          color: var(--spc-media-browser-items-list-color, var(--spc-media-browser-items-color, var(--primary-text-color, #ffffff)));
        }

        .subtitle {
          font-size: var(--spc-media-browser-items-subtitle-font-size, 0.8rem);
          font-weight: normal;
          line-height: 120%;
          padding-bottom: 0.25rem;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        /* *********************************************************** */
        /* the remaining styles are used for the sound animation icon. */
        /* *********************************************************** */
        .bars {
          height: 30px;
          left: 50%;
          margin: -30px 0 0 -20px;
          position: relative;
          top: 65%;
          width: 40px;
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
      listStyle,
    ];
  }
}

customElements.define('spc-media-browser-list', MediaBrowserList);

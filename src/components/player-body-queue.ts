// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":player-body-queue");

// lovelace card imports.
import { css, html, PropertyValues, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import {
  mdiPlay,
} from '@mdi/js';

// our imports.
import { ALERT_ERROR_SPOTIFY_PREMIUM_REQUIRED, DOMAIN_SPOTIFYPLUS } from '../constants';
import { sharedStylesGrid } from '../styles/shared-styles-grid.js';
import { sharedStylesMediaInfo } from '../styles/shared-styles-media-info.js';
import { sharedStylesFavActions } from '../styles/shared-styles-fav-actions.js';
import { getMediaListTrackUrisRemaining } from '../utils/media-browser-utils.js';
import { getHomeAssistantErrorMessage } from '../utils/utils';
import { PlayerBodyBase } from './player-body-base';
import { MediaPlayer } from '../model/media-player';
import { IPlayerQueueInfo } from '../types/spotifyplus/player-queue-info';
import { ITrack } from '../types/spotifyplus/track';
import { GetPlaylistPageTracks } from '../types/spotifyplus/playlist-page';
import { getIdFromSpotifyUri, getTypeFromSpotifyUri } from '../services/spotifyplus-service';

/**
 * Track actions.
 */
enum Actions {
  EpisodePlay = "EpisodePlay",
  GetPlayerQueueInfo = "GetPlayerQueueInfo",
  TrackPlay = "TrackPlay",
}


export class PlayerBodyQueue extends PlayerBodyBase {

  // private state properties.
  @state() private queueInfo?: IPlayerQueueInfo;
  @state() private fallbackQueue?: Array<any>;
  @state() private currentItem?: any;
  @state() private playedHistory: Array<any> = [];
  private queueEmptyRetryCount: number = 0;
  private fallbackContextUri?: string;
  private lastCurrentUri?: string;
  private scrollPending: boolean = false;


  /**
   * Called when the element has rendered for the first time.
   * Auto-refresh queue items when component is first displayed.
   */
  protected override firstUpdated(changedProperties: PropertyValues): void {
    super.firstUpdated(changedProperties);

    // Auto-refresh queue items after a short delay to ensure store is ready
    setTimeout(() => {
      this.refreshQueueItems();
    }, 100);
  }


  /**
   * Called after the component is updated.
   * Refresh queue when song changes.
   */
  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // If mediaContentId changed, refresh the queue
    if (changedProperties.has('mediaContentId') && this.mediaContentId) {
      this.syncCurrentItem();
      setTimeout(() => {
        this.scheduleScrollToCurrent();
      }, 0);
      setTimeout(() => {
        this.refreshQueueItems();
      }, 200);
    }

    if (changedProperties.has('queueInfo') || changedProperties.has('fallbackQueue') || changedProperties.has('playedHistory')) {
      this.scheduleScrollToCurrent();
    }
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
      <div class="player-body-container" hide=${this.isPlayerStopped}>
        <div class="player-body-container-scrollable">
          ${this.alertError ? html`<ha-alert alert-type="error" dismissable @alert-dismissed-clicked=${this.alertErrorClear}>${this.alertError}</ha-alert>` : ""}
          ${this.alertInfo ? html`<ha-alert alert-type="info" dismissable @alert-dismissed-clicked=${this.alertInfoClear}>${this.alertInfo}</ha-alert>` : ""}
                    <div class="queue-list">
            ${(this.getQueueDisplayItems() || []).length > 0 ? html`
              ${this.getQueueDisplayItems().map((item) => {
                const isCurrent = (item as any).__isCurrent;
                const artist = (item as any).type == 'episode'
                  ? ((item as any).show?.name || "")
                  : ((item as any).artists?.[0]?.name || "");
                const duration = this.formatDuration((item as any).duration_ms);
                return html`
                  <div class="queue-item ${isCurrent ? 'queue-item-current' : ''}"
                       data-current=${isCurrent ? 'true' : 'false'}
                       @click=${() => this.onClickAction((item as any).type == 'episode' ? Actions.EpisodePlay : Actions.TrackPlay, item)}>
                    <div class="queue-item-artwork" style="background-image: url(${(item as any).image_url || ((item as any).type == 'episode' ? ((item as any).images?.[0]?.url || '') : ((item as any).album?.images?.[0]?.url || ''))})"></div>
                    <div class="queue-item-info">
                      <div class="queue-item-title">${item.name || ""}</div>
                      <div class="queue-item-artist">${artist}${duration ? ` - ${duration}` : ""}</div>
                    </div>
                    ${isCurrent ? html`
                      <div class="queue-now-playing-bars" aria-hidden="true">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                      </div>
                    ` : html`<ha-icon-button class="queue-item-menu" .path=${mdiPlay} label="Play"></ha-icon-button>`}
                  </div>
                `;
              })}
            ` : html`
              <div class="queue-empty">No items in queue</div>
            `}
          </div>
        </div>
      </div>`;
  }


  /**
   * style definitions used by this component.
   * */
  static get styles() {
    return [
      sharedStylesGrid,
      sharedStylesMediaInfo,
      sharedStylesFavActions,
      css`
        .player-body-container {
          height: 100%;
          overflow: hidden;
          background: transparent;
        }

        .player-body-container-scrollable {
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          background: transparent;
        }

        /* YouTube Music style queue list */
        .queue-list {
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .queue-item {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          gap: 0.75rem;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .queue-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .queue-item-current {
          background-color: rgba(255, 255, 255, 0.12);
        }

        .queue-item-artwork {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 4px;
          background-size: cover;
          background-position: center;
          background-color: transparent;
          background-repeat: no-repeat;
        }

        .queue-item-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }

        .queue-item-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-item-artist {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-item-menu {
          --mdc-icon-button-size: 32px;
          --mdc-icon-size: 20px;
          color: rgba(255, 255, 255, 0.5);
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .queue-item:hover .queue-item-menu {
          opacity: 1;
        }

        .queue-now-playing-bars {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          width: 18px;
          height: 18px;
        }

        .queue-now-playing-bars .bar {
          width: 3px;
          height: 6px;
          background-color: #ffffff;
          opacity: 0.85;
          animation: queueBarBounce 1s infinite ease-in-out;
        }

        .queue-now-playing-bars .bar:nth-child(2) {
          animation-delay: 0.15s;
        }

        .queue-now-playing-bars .bar:nth-child(3) {
          animation-delay: 0.3s;
        }

        .queue-now-playing-bars .bar:nth-child(4) {
          animation-delay: 0.45s;
        }

        .queue-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
        }

        /* Legacy grid styles - kept for compatibility */
        .queue-info-grid-container {
          margin: 0.25rem;
        }

        .queue-info-grid {
          grid-template-columns: 30px 45px auto auto;
        }

        .queue-info-grid-no-items {
          grid-column-start: 1;
          grid-column-end: 4;
        }

        .queue-info-grid > ha-icon-button[slot="icon-button"] {
          --mdc-icon-button-size: 24px;
          --mdc-icon-size: 20px;
          vertical-align: top;
          padding: 0px;
        }

        @keyframes queueBarBounce {
          0%,
          100% {
            height: 5px;
          }
          50% {
            height: 16px;
          }
        }
      `
    ];
  }

  /**
   * Formats duration in milliseconds to MM:SS format.
   */
  private formatDuration(ms: number | undefined): string {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Builds a queue item representing the currently playing track.
   */
  private buildCurrentItem(): any | undefined {
    const attrs = this.player?.attributes;
    if (!attrs) {
      return undefined;
    }

    const uri = attrs.sp_track_uri_origin || attrs.media_content_id || '';
    if (!uri) {
      return undefined;
    }

    const imageUrl = (attrs as any).sp_nowplaying_image_url || attrs.media_image_url || '';
    const durationMs = attrs.media_duration ? Math.round(attrs.media_duration * 1000) : undefined;

    return {
      type: 'track',
      uri: attrs.media_content_id || uri,
      uri_origin: attrs.sp_track_uri_origin || uri,
      name: attrs.media_title || '',
      artists: [{ name: attrs.media_artist || '' }],
      duration_ms: durationMs,
      image_url: imageUrl,
      album: imageUrl ? { images: [{ url: imageUrl }] } : undefined,
    };
  }

  /**
   * Syncs the current item and tracks played history.
   */
  private syncCurrentItem(): void {
    const nextCurrent = this.buildCurrentItem();
    const nextUri = nextCurrent?.uri_origin || nextCurrent?.uri;
    if (!nextUri) {
      return;
    }

    if (this.lastCurrentUri && this.currentItem && this.lastCurrentUri !== nextUri) {
      const history = [this.currentItem, ...this.playedHistory];
      const deduped: Array<any> = [];
      const seen = new Set<string>();
      for (const item of history) {
        const uri = (item as any)?.uri_origin || (item as any)?.uri;
        if (!uri || seen.has(uri)) {
          continue;
        }
        seen.add(uri);
        deduped.push(item);
        if (deduped.length >= 50) {
          break;
        }
      }
      this.playedHistory = deduped;
    }

    this.currentItem = nextCurrent;
    this.lastCurrentUri = nextUri;
  }

  /**
   * Returns queue items to display, marking the current item.
   */
  private getQueueDisplayItems(): Array<any> {
    const currentUri = this.lastCurrentUri;
    if (!currentUri) {
      return [];
    }

    if ((this.fallbackQueue?.length || 0) > 0) {
      const baseItems = [...(this.fallbackQueue || [])];
      const hasCurrent = baseItems.some((item) => {
        const uri = (item as any).uri_origin || (item as any).uri;
        return uri === currentUri;
      });
      if (!hasCurrent && this.currentItem) {
        baseItems.unshift(this.currentItem);
      }
      return baseItems.map((item) => {
        const uri = (item as any).uri_origin || (item as any).uri;
        return { ...item, __isCurrent: uri === currentUri };
      });
    }

    const items: Array<any> = [];
    if (this.playedHistory.length > 0) {
      items.push(...this.playedHistory);
    }
    if (this.currentItem) {
      items.push(this.currentItem);
    }
    if ((this.queueInfo?.queue || []).length > 0) {
      items.push(...this.queueInfo!.queue);
    }

    return items.map((item) => {
      const uri = (item as any).uri_origin || (item as any).uri;
      return { ...item, __isCurrent: uri === currentUri };
    });
  }

  /**
   * Returns queue items to use for playback actions.
   */
  private getQueuePlayableItems(): Array<any> {
    return this.getQueueDisplayItems();
  }

  /**
   * Scrolls the list so the current item is visible at the top.
   */
  private scheduleScrollToCurrent(): void {
    if (this.scrollPending) {
      return;
    }
    this.scrollPending = true;
    requestAnimationFrame(() => {
      this.scrollPending = false;
      const container = this.shadowRoot?.querySelector('.player-body-container-scrollable') as HTMLElement | null;
      const current = container?.querySelector('[data-current="true"]') as HTMLElement | null;
      if (container && current) {
        container.scrollTop = current.offsetTop;
      }
    });
  }

  /**
   * Loads a fallback queue list from the current context if the API queue is empty.
   */
  private async loadFallbackQueue(): Promise<void> {
    const contextUri = this.player.attributes.sp_context_uri
      || (this.player.attributes as any).media_context_content_id
      || this.player.attributes.sp_playlist_uri
      || '';
    if (!contextUri) {
      this.fallbackQueue = undefined;
      this.fallbackContextUri = undefined;
      return;
    }

    if (this.fallbackContextUri === contextUri && (this.fallbackQueue?.length || 0) > 0) {
      return;
    }

    const contextType = getTypeFromSpotifyUri(contextUri) || '';
    const contextId = getIdFromSpotifyUri(contextUri);
    if (!contextId) {
      this.fallbackQueue = undefined;
      this.fallbackContextUri = undefined;
      return;
    }

    try {
      let tracks: Array<ITrack> = [];
      const market = this.player.attributes.sp_user_country || null;
      if (contextType === 'playlist') {
        const page = await this.spotifyPlusService.GetPlaylistItems(this.player, contextId, null, null, market, null, null, 200);
        tracks = GetPlaylistPageTracks(page) as Array<ITrack>;
      } else if (contextType === 'album') {
        const page = await this.spotifyPlusService.GetAlbumTracks(this.player, contextId, null, null, market, 200);
        tracks = (page.items || []) as Array<ITrack>;
      } else {
        this.fallbackQueue = undefined;
        this.fallbackContextUri = undefined;
        return;
      }

      const fallbackImage = (this.player.attributes as any).sp_nowplaying_image_url || this.player.attributes.media_image_url || '';
      if (fallbackImage) {
        tracks.forEach((item) => {
          if (!(item as any).image_url) {
            (item as any).image_url = fallbackImage;
          }
        });
      }

      if (tracks.length > 0 && (this.queueInfo?.queue || []).length === 0) {
        this.queueInfo = {
          currently_playing: null,
          currently_playing_type: null,
          queue: tracks as Array<ITrack>,
          date_last_refreshed: Date.now() / 1000,
        };
      }

      this.fallbackQueue = tracks;
      this.fallbackContextUri = contextUri;
      this.requestUpdate();
    } catch {
      this.fallbackQueue = undefined;
      this.fallbackContextUri = undefined;
    }
  }


  /**
   * Refreshes the queue items list.  This function can be called when the queue info
   * display is initially opened.
   * 
   * @param action Action to execute.
   * @param item Action arguments.
   */
  public refreshQueueItems(): void {

    const playerId = this.player?.id;
    if (playerId) {
      this.store.hass.callService(DOMAIN_SPOTIFYPLUS, 'trigger_scan_interval', {
        entity_id: playerId,
      }).catch(() => {
      }).finally(() => {
        setTimeout(() => {
          this.updateActions(this.player, [Actions.GetPlayerQueueInfo]);
        }, 400);
      });
      return;
    }

    this.updateActions(this.player, [Actions.GetPlayerQueueInfo]);

  }


  /**
   * Handles the `click` event fired when a control icon is clicked.
   * 
   * @param action Action to execute.
   * @param item Action arguments.
   */
  protected override async onClickAction(action: Actions, item: any = null): Promise<boolean> {

    try {

      // show progress indicator.
      this.progressShow();

      // call service based on requested action, and refresh affected action component.
      if (action == Actions.GetPlayerQueueInfo) {

        this.updateActions(this.player, [Actions.GetPlayerQueueInfo]);

      } else if (action == Actions.EpisodePlay) {

        // if a device was recently selected, wait for the transfer to complete before playback.
        const deviceId = await this.store.prepareDevicePlayback(30000, 500);
        await this.spotifyPlusService.Card_PlayMediaBrowserItem(this.player, item, deviceId);
        this.progressHide();
        setTimeout(() => this.refreshQueueItems(), 600);

      } else if (action == Actions.TrackPlay) {

        // if a device was recently selected, wait for the transfer to complete before playback.
        const deviceId = await this.store.prepareDevicePlayback(30000, 500);

        // build track uri list from media list.
        const { uris } = getMediaListTrackUrisRemaining(this.getQueuePlayableItems() as ITrack[], item);

        // play the selected track, as well as the remaining tracks.
        // also disable shuffle, as we want to play the selected track first.
        await this.spotifyPlusService.PlayerMediaPlayTracks(this.player, uris.join(","), null, deviceId, null, false);

        // hide progress indicator.
        this.progressHide();
        setTimeout(() => this.refreshQueueItems(), 600);

      } else {

        // no action selected - hide progress indicator.
        this.progressHide();

      }
      return true;

    }
    catch (error) {

      // clear the progress indicator and set alert error message.
      this.progressHide();
      this.alertErrorSet("Action failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }

  }


  /**
   * Updates body actions.
   * 
   * @param player Media player instance that will process the update.
   * @param updateActions List of actions that need to be updated, or an empty list to update DEFAULT actions.
   * @returns True if actions update should continue after calling base class method; otherwise, False to abort actions update.
   */
  protected override updateActions(
    player: MediaPlayer,
    updateActions: any[],
  ): boolean {

    // invoke base class method; if it returns false, then we should not update actions.
    if (!super.updateActions(player, updateActions)) {
      return false;
    }

    try {

      const promiseRequests = new Array<Promise<unknown>>();

      // was this action chosen to be updated?
      // note that we disabled default refresh processing (e.g. "|| (updateActions.length == 0)" since
      // we want to manually force the refresh when the queue body is is displayed.
      if (updateActions.indexOf(Actions.GetPlayerQueueInfo) != -1) {

        // spotify premium account required for this function.
        // not supported by elevated credentials.
        if (!player.isUserProductPremium()) {
          throw new Error(ALERT_ERROR_SPOTIFY_PREMIUM_REQUIRED);
        }

        // create promise - update currently playing media item.
        const promiseGetPlayingItem = new Promise((resolve, reject) => {

          // call service to retrieve media item that is currently playing.
          this.spotifyPlusService.GetPlayerQueueInfo(player)
            .then(async result => {

              try {
                // load results, update favorites, and resolve the promise.
                this.queueInfo = result;
                const queueLength = (this.queueInfo?.queue || []).length;
                if (queueLength > 0) {
                  this.fallbackQueue = undefined;
                  this.fallbackContextUri = undefined;
                }
                if (queueLength === 0 && this.player?.isPlaying()) {
                  this.queueEmptyRetryCount += 1;
                  if (this.queueEmptyRetryCount <= 2) {
                    setTimeout(() => this.refreshQueueItems(), 1200);
                  }
                } else {
                  this.queueEmptyRetryCount = 0;
                }

                if (queueLength === 0) {
                  await this.loadFallbackQueue();
                }

                //// update the whole player body queue element.
                //const spcPlayerBodyQueue = closestElement('#elmPlayerBodyQueue', this) as PlayerBodyQueue;
                //spcPlayerBodyQueue.requestUpdate();

                ////this.requestUpdate();
                //// update display.
                //setTimeout(() => {
                //  //this.requestUpdate();
                //  const spcPlayerBodyQueue = closestElement('#elmPlayerBodyQueue', this) as PlayerBodyQueue;
                //  spcPlayerBodyQueue.requestUpdate();
                //  debuglog("updateActions - queueInfo refreshed successfully (setTimeout)");
                //}, 2000);

                if (debuglog.enabled) {
                  debuglog("updateActions - queueInfo refreshed successfully");
                }

                resolve(true);
              } catch (error) {
                this.alertErrorSet("Queue fallback failed: " + getHomeAssistantErrorMessage(error));
                resolve(true);
              }

            })
            .catch(error => {

              // clear results, and reject the promise.
              this.queueInfo = undefined;
              this.alertErrorSet("Get Player Queue Info call failed: " + getHomeAssistantErrorMessage(error));
              reject(error);

            })
        });

        promiseRequests.push(promiseGetPlayingItem);
      }

      // show visual progress indicator.
      this.progressShow();

      // execute all promises, and wait for all of them to settle.
      // we use `finally` logic so we can clear the progress indicator.
      // any exceptions raised should have already been handled in the 
      // individual promise definitions; nothing else to do at this point.
      Promise.allSettled(promiseRequests).finally(() => {

        // clear the progress indicator.
        this.progressHide();

        // call base class method for post actions update processing.
        this.updateActionsComplete(updateActions);

      });
      return true;

    }
    catch (error) {

      // clear the progress indicator and set alert error message.
      this.progressHide();
      this.alertErrorSet("Queue info refresh failed: " + getHomeAssistantErrorMessage(error));
      return true;

    }
    finally {
    }
  }

}

customElements.define('spc-player-body-queue', PlayerBodyQueue);





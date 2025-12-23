// debug logging.
import Debug from 'debug/src/browser.js';
import { DEBUG_APP_NAME } from '../constants';
const debuglog = Debug(DEBUG_APP_NAME + ":store");

// lovelace card imports.
import { HomeAssistant } from '../types/home-assistant-frontend/home-assistant';

// our imports.
import { DOMAIN_SPOTIFYPLUS } from '../constants';
import { HassService } from '../services/hass-service';
import { MediaControlService } from '../services/media-control-service';
import { SpotifyPlusService } from '../services/spotifyplus-service';
import { Card } from '../card';
import { BaseEditor } from '../editor/base-editor';
import { CardConfig } from '../types/card-config';
import { ConfigArea } from '../types/config-area';
import { Section } from '../types/section';
import { MediaPlayer } from './media-player';
import { getEntityRegistryDisplayEntry_ByEntityId, getHassEntityState_ByEntityId } from '../types/home-assistant-frontend/ha-utils';


/**
 * Card storage class instance.  
 * 
 * This class is used to store references to common services and data areas
 * that are used by the various card sections.
 * */
export class Store {

  /** Home Assistant instance. */
  public hass: HomeAssistant;

  /** Card configuration data. */
  public config: CardConfig;

  /** Custom card instance. */
  public readonly card: Card | BaseEditor;

  /** Home Assistant services helper instance. */
  public hassService: HassService;

  /** SpotifyPlus services helper instance. */
  public spotifyPlusService: SpotifyPlusService;

  /** MediaControlService services helper instance. */
  public mediaControlService: MediaControlService;

  /** SpotifyPlus MediaPlayer object that will process requests. */
  public player: MediaPlayer;

  /** Currently selected section. */
  public section: Section;

  /** Most recently selected device id (name or id) for transfers. */
  public lastDeviceTransferId?: string;

  /** Timestamp (epoch ms) of the last device transfer selection. */
  public lastDeviceTransferAt?: number;

  /** True if the last device transfer was to a restricted device. */
  public lastDeviceTransferIsRestricted?: boolean;
  /** Currently selected ConfigArea **/
  static selectedConfigArea: ConfigArea = ConfigArea.GENERAL;

  /** card editor render flags for individual sections. */
  static hasCardEditLoadedMediaList: { [key: string]: boolean } = {};


  /**
   * Initializes a new instance of the class.
   * 
   * @param hass Home Assistant instance.
   * @param config Card configuration data.
   * @param card Custom card instance.
   * @param section Currently selected section of the card.
   */
  constructor(hass: HomeAssistant, config: CardConfig, card: Card | BaseEditor, section: Section) {

    // if hass property has not been set yet, then it's a programmer problem!
    if (!hass) {
      throw new Error("STPC0005 hass property has not been set!");
    }

    // initialize storage.
    this.hass = hass;
    this.config = config;
    this.card = card;
    this.hassService = new HassService(hass);
    this.mediaControlService = new MediaControlService(this.hassService);
    this.spotifyPlusService = new SpotifyPlusService(hass, card, config);
    this.player = this.getMediaPlayerObject();
    this.section = section;

    // keep compiler happy.
    if (debuglog.enabled) {
    }

  }


  /**
   * Records a device transfer selection so playback can target it shortly after.
   */
  public markDeviceTransfer(deviceId: string, isRestricted: boolean = false): void {
    if (!deviceId) {
      return;
    }
    this.lastDeviceTransferId = deviceId;
    this.lastDeviceTransferAt = Date.now();
    this.lastDeviceTransferIsRestricted = isRestricted;
  }


  /**
   * Returns recent device transfer info if still within the provided window.
   */
  public getRecentDeviceTransferInfo(windowMs: number): { id: string; isRestricted: boolean } | undefined {
    if (!this.lastDeviceTransferId || !this.lastDeviceTransferAt) {
      return undefined;
    }
    if (Date.now() - this.lastDeviceTransferAt > windowMs) {
      this.lastDeviceTransferId = undefined;
      this.lastDeviceTransferAt = undefined;
      this.lastDeviceTransferIsRestricted = undefined;
      return undefined;
    }
    return {
      id: this.lastDeviceTransferId,
      isRestricted: this.lastDeviceTransferIsRestricted || false,
    };
  }


  /**
   * Waits briefly after a transfer and syncs player state before playback.
   */
  public async prepareDevicePlayback(windowMs: number, waitMs: number): Promise<string | undefined> {
    const recent = this.getRecentDeviceTransferInfo(windowMs);
    if (!recent) {
      return undefined;
    }

    if (recent.isRestricted) {
      try {
        await this.hass.callService(DOMAIN_SPOTIFYPLUS, 'player_transfer_playback', {
          entity_id: this.config.entity,
          device_id: recent.id,
          play: false,
          force_activate_device: true,
        });
      } catch {
      }
    }

    const effectiveWaitMs = recent.isRestricted ? waitMs + 1500 : waitMs;
    if (effectiveWaitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, effectiveWaitMs));
    }

    try {
      await this.hass.callService(DOMAIN_SPOTIFYPLUS, 'trigger_scan_interval', {
        entity_id: this.config.entity,
      });
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch {
    }

    this.player = this.getMediaPlayerObject();

    return recent.isRestricted ? undefined : recent.id;
  }


  /**
   * Returns a MediaPlayer object for the given card configuration entity id value.
   * 
   * @returns A MediaPlayer object.
   * @throws Error if the specified entityId values does not exist in the hass.states data.
   */
  public getMediaPlayerObject(): MediaPlayer {

    const playerEntityId = this.config.entity + "";
    let player: MediaPlayer | null = null;
    let playerState = "";

    do {

      // has an entity been configured?
      if ((!this.config) || (!this.config.entity) || (this.config.entity.trim() == "")) {
        // `entity` value will not be set in the config if coming from the card picker;
        // this is ok, as we want it to render a "needs configured" card ui.
        // in this case, we just return an "empty" MediaPlayer instance.
        break;
      }

      // does an ACTIVE entity id exist in hass entities data for our domain?
      // if not, then it's an error!
      const hassEntity = getEntityRegistryDisplayEntry_ByEntityId(this.hass, playerEntityId);
      if (hassEntity) {
        if (hassEntity.platform != DOMAIN_SPOTIFYPLUS) {
          playerState = "Card configuration `entity` value " + JSON.stringify(playerEntityId) + " is not a " + JSON.stringify(DOMAIN_SPOTIFYPLUS) + " platform media player.";
          break;
        }
      } else {
        playerState = "Card configuration `entity` value " + JSON.stringify(playerEntityId) + " is not defined in HA entities table; is it disabled? is `entity` value spelled correctly (search is case-sensitive)?";
        break;
      }

      // does entity id exist in hass states data?
      const hassEntityState = getHassEntityState_ByEntityId(this.hass, this.config.entity);
      if (hassEntityState) {
        player = new MediaPlayer(hassEntityState);
        //  if (debuglog.enabled) {
        //    debuglog("%cgetMediaPlayerObject - media player was resolved:\n%s",
        //      "color:red",
        //      JSON.stringify(hassEntityState, null, 2),
        //    );
        //  }
      } else {
        playerState = "Card configuration `entity` value " + JSON.stringify(playerEntityId) + " could not be found in the HA state machine.";
        break;
      }

      // if media player state object was resolved then return it.
      if (player) {
        return player;
      }

      // at this point, the card configuration `entity` value could not be resolved 
      // to an active SoundTouchPlus MediaPlayerEntity instance.
      playerState = "Card configuration `entity` value " + JSON.stringify(playerEntityId) + " was not found in the HA state machine; is it disabled?";
      break;

    } while (true);

    // trace.
    //if (debuglog.enabled) {
    //  debuglog("%cgetMediaPlayerObject - media player not resolved:\n%s",
    //    "color:red",
    //    playerState
    //  );
    //}

    // if player could not be resolved then create an empty one so that the
    // card still renders; the `stp_config_state` attribute value will contain
    // the reason that the card did not render properly, and will be displayed
    // to the user on the main card UI.
    player = new MediaPlayer({
      entity_id: "",
      state: "",
      last_changed: "",
      last_updated: "",
      attributes: { "sp_config_state": playerState },
      context: {
        id: "",
        user_id: "",
        parent_id: "",
      }
    });

    return player;
  }

}

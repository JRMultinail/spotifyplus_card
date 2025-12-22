import { DOMAIN_SPOTIFYPLUS } from '../constants';

/** 
 * Uniquely identifies the event. 
 * */
export const DEVICES_POPOUT_TOGGLE = DOMAIN_SPOTIFYPLUS + '-card-devices-popout-toggle';

/**
 * Event constructor.
 */
export function DevicesPopoutToggleEvent(open?: boolean) {

  return new CustomEvent(DEVICES_POPOUT_TOGGLE, {
    bubbles: true,
    composed: true,
    detail: {
      open: open,
    },
  });

}

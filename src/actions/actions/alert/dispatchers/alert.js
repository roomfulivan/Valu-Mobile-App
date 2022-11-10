import store from "../../../../store"
import { triggerHaptic } from "../../../../utils/haptics/haptics"
import getUid from '../../../../utils/uid'
import { completeAlert, pushAlert, setActiveAlert, shiftAlerts } from "../creators/alert"

export const createAlert = (title, message, buttons = [{text: "OK", onPress: () => resolveAlert(true)}], options, type) => {
  return new Promise((resolve) => {
    const alertId = getUid()
    let opened = false

    const unsub = store.subscribe(() => {
      const state = store.getState()

      if (state.alert.queue[0] === alertId) {
        if (state.alert.active == null) {
          if (!opened) {
            store.dispatch(setActiveAlert({
              title,
              message,
              buttons,
              options,
              type,
              uid: alertId
            }))
            triggerHaptic("notificationWarning")
          } else {
            store.dispatch(shiftAlerts())
            unsub()
            resolve(state.alert.result)
          }
        } else if (state.alert.active.uid == alertId) {
          opened = true
        } else {
          console.warn("Error opening alert")
          resolve()
        }
      }
    })

    store.dispatch(pushAlert(alertId))
  })
}

export const resolveAlert = result => {
  store.dispatch(completeAlert(result))
}
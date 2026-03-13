export interface DemoModeConfig {
  enabled: boolean
  features: {
    canMovePlayer: boolean
    canAssignTasks: boolean
    canSendMessages: boolean
    showAgentDetails: boolean
    wsConnection: 'live' | 'mock'
  }
}

const isDemoEnabled = (): boolean => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NEXT_PUBLIC_OFFICE_DEMO_MODE === 'true'
  }
  return false
}

export const DEMO_MODE_CONFIG: DemoModeConfig = {
  enabled: isDemoEnabled(),
  features: {
    canMovePlayer: true,
    canAssignTasks: false,
    canSendMessages: false,
    showAgentDetails: true,
    wsConnection: 'mock',
  },
}

export function isDemoMode(): boolean {
  return DEMO_MODE_CONFIG.enabled
}

export function canPerformAction(action: keyof DemoModeConfig['features']): boolean {
  if (!DEMO_MODE_CONFIG.enabled) return true
  return DEMO_MODE_CONFIG.features[action] as boolean
}

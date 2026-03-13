import { useOfficeStore } from '@/stores/office-store'

export interface TaskRequest {
  agentId: string
  agentName: string
  description: string
  priority?: 'low' | 'medium' | 'high'
}

export class TaskSystem {
  
  static async assignTask(request: TaskRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Sanitize input (ARCHITECT recommendation)
      const sanitizedDesc = request.description
        .slice(0, 1000)
        .replace(/<[^>]*>/g, '')
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Task for ${request.agentName}`,
          description: sanitizedDesc,
          agent: request.agentId,
          priority: request.priority || 'medium',
          status: 'inbox',
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, message: error || 'Failed to assign task' }
      }

      // Update agent status to busy
      useOfficeStore.getState().updateAgentStatus(request.agentId, 'busy')
      
      return { success: true, message: 'Task assigned successfully' }
    } catch (error) {
      console.error('[TaskSystem] Error:', error)
      return { success: false, message: 'Network error' }
    }
  }

  static async sendMessage(agentId: string, message: string): Promise<{ success: boolean }> {
    try {
      // This would integrate with OpenClaw sessions
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agentId,
          content: message.slice(0, 2000),
        }),
      })
      
      return { success: response.ok }
    } catch {
      return { success: false }
    }
  }
}

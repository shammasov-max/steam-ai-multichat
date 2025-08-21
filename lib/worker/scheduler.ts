import { processNewTasks } from '../rr/roundRobin'
import { processAssignedTasks } from '../invites/pacer'
import { processAcceptedChats } from '../agent/runner'

class Scheduler {
    private intervals: NodeJS.Timeout[] = []
  
    start() {
        this.intervals.push(
            setInterval(() => {
                processNewTasks().catch(console.error)
            }, 2000)
        )
    
        this.intervals.push(
            setInterval(() => {
                processAssignedTasks().catch(console.error)
            }, 5000)
        )
    
        this.intervals.push(
            setInterval(() => {
                processAcceptedChats().catch(console.error)
            }, 3000)
        )
    
        console.log('Scheduler started')
    }
  
    stop() {
        this.intervals.forEach(interval => clearInterval(interval))
        this.intervals = []
        console.log('Scheduler stopped')
    }
}

export const scheduler = new Scheduler()
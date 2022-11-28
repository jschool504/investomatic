interface IntervalJob {
    runOnStart: boolean
    interval: number
    function: Function
}

export default class Scheduler {

    intervalJobs: IntervalJob[] = []
    intervalJobIds: NodeJS.Timer[] = []

    constructor() {}

    add(job: IntervalJob) {
        this.intervalJobs.push(job)
    }

    /**
     * starts all jobs
     */
    start() {
        this.intervalJobs.forEach(job => {
            const id = setInterval(() => {
                job.function()
            }, job.interval)
            this.intervalJobIds.push(id)

            if (job.runOnStart) {
               job.function()
            }

        })
    }

    stop() {
        this.intervalJobIds.forEach(id => clearInterval(id))
    }

}

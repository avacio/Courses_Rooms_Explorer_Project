export function handleMAX(data: any, key: any): any {
    for (let group of data) {
        let max: number = 0;
        for (let section of group) {
            if (section[key.toString()] > max) {
                max = section[key.toString()];
            }
        }
    }
}

export function handleMIN(data: any, key: any): any {
    for (let group of data) {
        let min: number = Number.MAX_VALUE;
        for (let section of group) {
            if (section[key.toString()] < min) {
                min = section[key.toString()];
            }
        }
    }
}

export function handleAVG(data: any, key: any): any {
    for (let group of data) {
        let sum: number = 0;
        let count: number = 0;
        for (let section of group) {
            sum += section[key.toString()];
            count++;
        }
        let avg: number = sum / count;
    }
}

export function handleSUM(data: any, key: any): any {
    for (let group of data) {
        let sum = 0;
        for (let section of group) {
            sum += section[key.toString()];
        }
    }
}

export function handleCOUNT(data: any, key: any): any {
    for (let group of data) {
        let count: number = 0;
        for (let section of group) {
            if (section[key.toString()]) {
                count++;
            }
        }
    }
}

import SteamTotp from 'steam-totp'
import { MaFile } from '../types'

export class MaFileHandler {
    private maFile: MaFile

    constructor(maFile: MaFile | string) {
        if (typeof maFile === 'string') {
            try {
                this.maFile = JSON.parse(maFile)
            } catch (error) {
                throw new Error(`Invalid maFile JSON: ${error}`)
            }
        } else {
            this.maFile = maFile
        }
        
        this.validateMaFile()
    }

    private validateMaFile(): void {
        const required = ['shared_secret', 'identity_secret', 'account_name']
        for (const field of required) {
            if (!this.maFile[field as keyof MaFile]) {
                throw new Error(`Missing required maFile field: ${field}`)
            }
        }
    }

    getSharedSecret(): string {
        return this.maFile.shared_secret
    }

    getIdentitySecret(): string {
        return this.maFile.identity_secret
    }

    getAccountName(): string {
        return this.maFile.account_name
    }

    generateAuthCode(): string {
        return SteamTotp.generateAuthCode(this.maFile.shared_secret)
    }

    generateConfirmationKey(time: number, tag: string): string {
        return SteamTotp.generateConfirmationKey(this.maFile.identity_secret, time, tag)
    }

    getDeviceId(): string {
        return this.maFile.device_id || 'android:' + this.generateDeviceId()
    }

    private generateDeviceId(): string {
        const chars = '0123456789abcdef'
        let deviceId = ''
        for (let i = 0; i < 16; i++) {
            deviceId += chars[Math.floor(Math.random() * chars.length)]
            if (i === 7) deviceId += '-'
        }
        return deviceId
    }

    toJSON(): MaFile {
        return this.maFile
    }
}
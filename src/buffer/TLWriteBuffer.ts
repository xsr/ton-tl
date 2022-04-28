import { BN } from "bn.js";
import { TLConstructor } from "../types";

export class TLWriteBuffer {
    #used = 0
    #buf = Buffer.alloc(128)

    #ensureSize(needBytes: number) {
        if ((this.#buf.byteLength - this.#used) <= needBytes) {
            this.#buf = Buffer.concat([this.#buf, Buffer.alloc(this.#buf.byteLength)]);
        }
    }

    writeInt32(val: number) {
        this.#ensureSize(4);
        this.#buf.writeInt32LE(val, this.#used);
        this.#used += 4;
    }

    writeUInt32(val: number) {
        this.#ensureSize(4);
        this.#buf.writeUInt32LE(val, this.#used);
        this.#used += 4;
    }

    writeInt64(val: string) {
        let hex = new BN(val, 10).toString('hex');
        while (hex.length < 16) {
            hex = '0' + hex;
        }
        this.#ensureSize(8);
        this.#buf.set(Buffer.from(hex, 'hex'), this.#used);
        this.#used += 8;
    }

    writeUInt8(val: number) {
        this.#ensureSize(4);
        this.#buf.writeUint8(val, this.#used);
        this.#used++;
    }

    writeInt256(val: Buffer) {
        this.#ensureSize(256 / 8)
        if (val.byteLength !== 256 / 8) {
            throw new Error('Invalid int256 length');
        }

        for (let byte of val) {
            this.writeUInt8(byte);
        }
    }

    writeBuffer(buf: Buffer) {
        this.#ensureSize(buf.byteLength + 4);
        let len = 0;
        if (buf.byteLength <= 253) {
            this.writeUInt8(buf.byteLength);
            len += 1;
        } else {
            // this.writeUInt8(254);
            throw new Error('Not implemented');
        }

        for (let byte of buf) {
            this.writeUInt8(byte);
            len += 1;
        }

        while (len % 4 !== 0) {
            this.writeUInt8(0);
            len += 1;
        }
    }

    writeString(src: string) {
        this.writeBuffer(Buffer.from(src));
    }

    writeBool(src: boolean) {
        if (src) {
            this.writeUInt8(1);
        } else {
            this.writeUInt8(0);
        }
    }

    writeConstructor(type: TLConstructor) {
        type.encode(this);
    }

    build() {
        return this.#buf.slice(0, this.#used);
    }
}
import xs from 'xstream';
import io from 'socket.io-client'

/**
 *
 * @param options {
  hostname: 'securedomain.com',
  secure: true,
  port: 443,
  rejectUnauthorized: false // Only necessary during debug if using a self-signed certificate
}
 * @returns {scDriver}
 */
export function makeSocketIODriver(options) {
    const socket = io(options);
    function get(eventName, { multiArgs = false } = {}) {

        return xs.create({
            start(listener) {
                this.eventListener = multiArgs
                    ? (...args) => listener.next(args)
                    : arg => listener.next(arg);

                socket.on(eventName, this.eventListener);
            },
            stop() {
                socket.off(eventName, this.eventListener);
            },
            eventListener: null,
        });
    }

    function publish(messageType, message) {
        socket.emit(messageType, message);
    }

    return function sioDriver(events$) {
        if (events$) {
            events$.addListener({
                next: i => {
                    if (!!i) {
                        publish(i.messageType, i.message)
                    }
                },
                error: err => console.error(err),
                complete: () => {
                    socket.disconnect();
                }
            })
        }
        return {
            get,
            socket: socket,
            dispose: () => {}
        }
    };
}
let isMuted = false

export function mute() {
  isMuted = true
}

export function unmute() {
  isMuted = false
}

export function writeln(output: any = '') {
  if (!isMuted) {
    (console.log)(`${output}`)
  }
}

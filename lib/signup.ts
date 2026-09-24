// El registro público está cerrado salvo que ALLOW_SIGNUP=true
export function isSignupOpen() {
  return process.env.ALLOW_SIGNUP === 'true';
}

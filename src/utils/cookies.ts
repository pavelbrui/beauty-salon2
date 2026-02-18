export const setCookie = (name: string, value: string, days: number = 30) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
};

export const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const saveUserData = (data: { name?: string; phone?: string; email?: string }) => {
  if (data.name) setCookie('user_name', data.name);
  if (data.phone) setCookie('user_phone', data.phone);
  if (data.email) setCookie('user_email', data.email);
};

export const getUserData = () => {
  return {
    name: getCookie('user_name') || '',
    phone: getCookie('user_phone') || '',
    email: getCookie('user_email') || '',
  };
};

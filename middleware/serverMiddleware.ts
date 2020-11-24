import { Context } from '@nuxt/types';

export default function (context: Context) {
  if (!context.$axios.defaults.baseURL)
    return context.redirect('/selectserver');
  if (context.$auth?.user?.Id) return context.redirect('/');
}

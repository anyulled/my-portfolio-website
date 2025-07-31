import { cache } from "react";

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  content: string;
  image?: string;
  date: string;
  featured: boolean;
}

export async function fetchTestimonialsFromDb(): Promise<Testimonial[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return [
    {
      id: "1",
      name: "Margerite",
      location: "Granollers, ES",
      rating: 4,
      content:
        "Buenas noches Anyul 👌...me han suuuper encantado, eres un gran profesional, muchas gracias por hacer que esta fantasía mía se cumpla... Me han gustado más d lo esperaba d verdad ( quitando algunas caras mías) el resto genial.. no pensé en decirte d quitar las letras blancas d las medias negras pero bueno 😁.. y las retocadas 👌👌",
      date: "2025-07-19",
      featured: true
    },
    {
      id: "2",
      name: "Delaia González",
      location: "Madrid, ES",
      rating: 5,
      content:
        "Anyul is a professional and nice person with artistic vision with whom I connected easily. I hope to meet again soon!",
      date: "2024-06-10",
      featured: true
    },
    {
      id: "3",
      name: "Laia Lázaro",
      location: "Cubelles, ES",
      rating: 4,
      content:
        "Los resultados han sido espectaculares, he quedado flipando, repetiría mil veces.",
      date: "2024-02-05",
      featured: false
    },
    {
      id: "4",
      name: "Emmazzione",
      location: "Paris, Fr",
      rating: 5,
      content:
        "I had an amazing shoot with Anyul ! We worked in the studio on different sets and tried different things according to his projects and our inspiration of the moment. Anyul is a good photographer and a welcoming, caring and friendly person. I had a beautiful shoot with him. I hope to work with him again on my next trip to Barcelona !",
      date: "2024-04-28",
      featured: true
    },
    {
      id: "5",
      name: "Abigail Marsh",
      location: "Barcelona, ES",
      rating: 4,
      content:
        "Anyull is a fantastic photographer. Super respectful and kind and VERY talented! I was blown away by the results of our sessions. Highly, highly recommend.",
      date: "2024-04-20",
      featured: false
    },
    {
      id: "6",
      name: "Sophie",
      location: "Warsaw, Pl",
      rating: 5,
      content:
        "I am very pleased to work with you! Favorite photographer and a very nice person who is very easy to work with and create fantastic photos!!!",
      date: "2023-04-15",
      featured: true
    }
  ];
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  return fetchTestimonialsFromDb();
});
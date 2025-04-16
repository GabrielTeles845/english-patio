export interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
  features: string[];
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  image?: string;
  rating: number;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
} 
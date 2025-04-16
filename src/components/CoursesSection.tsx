import { CheckIcon } from '@heroicons/react/24/outline';
import type { Course } from '../types';

const courses: Course[] = [
  {
    id: 1,
    title: 'Kids (4-7 anos)',
    description: 'Aprendizado através de brincadeiras, músicas e histórias',
    price: 'A partir de R$ 299/mês',
    features: [
      'Aulas 2x por semana',
      'Material didático exclusivo',
      'Atividades lúdicas',
      'Turmas pequenas (máx 4 alunos)',
      'Professores especializados',
    ],
  },
  {
    id: 2,
    title: 'Juniors (8-12 anos)',
    description: 'Desenvolvimento da comunicação em inglês de forma natural',
    price: 'A partir de R$ 399/mês',
    features: [
      'Aulas 2x por semana',
      'Material didático exclusivo',
      'Projetos interativos',
      'Turmas pequenas (máx 4 alunos)',
      'Professores especializados',
      'Atividades extracurriculares',
    ],
  },
  {
    id: 3,
    title: 'Teens (13-17 anos)',
    description: 'Preparação para o futuro com foco em comunicação',
    price: 'A partir de R$ 499/mês',
    features: [
      'Aulas 2x por semana',
      'Material didático exclusivo',
      'Preparação para exames',
      'Turmas pequenas (máx 4 alunos)',
      'Professores especializados',
      'Projetos em grupo',
      'Simulações de situações reais',
    ],
  },
];

const CoursesSection = () => {
  return (
    <div className="bg-gradient-to-b from-background-light to-background py-12" id="courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Cursos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-primary sm:text-4xl">
            Cursos para Cada Idade
          </p>
          <p className="mt-4 max-w-2xl text-xl text-primary lg:mx-auto">
            Oferecemos cursos específicos para cada faixa etária, sempre com muita diversão!
          </p>
        </div>

        <div className="mt-10 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card bg-background-light hover:shadow-2xl"
            >
              <div className="px-6 py-8">
                <h3 className="text-2xl font-semibold text-primary">{course.title}</h3>
                <p className="mt-4 text-primary">{course.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-secondary">{course.price}</span>
                </p>
                <ul className="mt-8 space-y-4">
                  {course.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-6 w-6 text-secondary" aria-hidden="true" />
                      </div>
                      <p className="ml-3 text-base text-primary">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href="#contact"
                    className="btn-primary w-full text-center"
                  >
                    Matricule Agora
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesSection; 
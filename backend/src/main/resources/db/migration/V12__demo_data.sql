CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin: insert fresh or promote if already registered
INSERT INTO users (user_id, email, display_name, password, role, email_verified, city, created_at)
VALUES (gen_random_uuid(), 'bekaaliyev848007@gmail.com', 'Admin',
        crypt('password123', gen_salt('bf', 10)), 'ADMIN', true, 'Astana', NOW())
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', email_verified = true;

-- Demo users
INSERT INTO users (user_id, email, display_name, password, role, email_verified, bio, city, avatar_url, created_at) VALUES
  (gen_random_uuid(), 'asel@mail.com', 'Asel Nurbekova',
   crypt('password123', gen_salt('bf', 10)), 'LEARNER', true,
   'CS student passionate about Python and AI. Looking to improve my English skills.',
   'Almaty', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Asel', NOW()),
  (gen_random_uuid(), 'dmitri@mail.com', 'Dmitri Volkov',
   crypt('password123', gen_salt('bf', 10)), 'LEARNER', true,
   'Freelance graphic designer with 10 years of experience. Want to learn Python for automation.',
   'Astana', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitri', NOW()),
  (gen_random_uuid(), 'alex@mail.com', 'Alexander Kim',
   crypt('password123', gen_salt('bf', 10)), 'LEARNER', true,
   'Full-stack developer and music enthusiast. I teach JavaScript and want to learn guitar.',
   'Almaty', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', NOW()),
  (gen_random_uuid(), 'sarah@mail.com', 'Sarah Omarova',
   crypt('password123', gen_salt('bf', 10)), 'LEARNER', true,
   'Professional photographer and cooking enthusiast. Teaching photography in exchange for language lessons.',
   'Shymkent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', NOW()),
  (gen_random_uuid(), 'bekzat@mail.com', 'Bekzat Yermek',
   crypt('password123', gen_salt('bf', 10)), 'LEARNER', true,
   'Business analyst and yoga instructor. Offering business analytics in exchange for cooking classes.',
   'Astana', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bekzat', NOW())
ON CONFLICT (email) DO NOTHING;

-- Skill profiles
INSERT INTO skill_profiles (profile_id, user_id, average_rating, total_sessions)
SELECT gen_random_uuid(), user_id, 4.8, 12 FROM users WHERE email = 'asel@mail.com'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO skill_profiles (profile_id, user_id, average_rating, total_sessions)
SELECT gen_random_uuid(), user_id, 4.9, 8 FROM users WHERE email = 'dmitri@mail.com'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO skill_profiles (profile_id, user_id, average_rating, total_sessions)
SELECT gen_random_uuid(), user_id, 4.6, 15 FROM users WHERE email = 'alex@mail.com'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO skill_profiles (profile_id, user_id, average_rating, total_sessions)
SELECT gen_random_uuid(), user_id, 4.7, 9 FROM users WHERE email = 'sarah@mail.com'
ON CONFLICT (user_id) DO NOTHING;
INSERT INTO skill_profiles (profile_id, user_id, average_rating, total_sessions)
SELECT gen_random_uuid(), user_id, 4.5, 6 FROM users WHERE email = 'bekzat@mail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Skills
INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Python Programming', 'PROGRAMMING', 'ADVANCED',
       'Advanced Python with Django/Flask, data science with pandas and numpy', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'asel@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Data Science', 'PROGRAMMING', 'INTERMEDIATE',
       'Machine learning basics, scikit-learn, TensorFlow intro', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'asel@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'English Conversation', 'LANGUAGE', 'INTERMEDIATE',
       'Looking for English practice partner for IELTS prep', false, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'asel@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Graphic Design', 'DESIGN', 'ADVANCED',
       'Adobe Photoshop, Illustrator, Figma — branding, UI/UX, and print design', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'dmitri@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'UI/UX Design', 'DESIGN', 'INTERMEDIATE',
       'Mobile app design, wireframing, prototyping in Figma', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'dmitri@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'JavaScript / React', 'PROGRAMMING', 'ADVANCED',
       'Full-stack JS: React, Node.js, Next.js, TypeScript', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'alex@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Guitar Playing', 'MUSIC', 'BEGINNER',
       'Want to learn acoustic guitar from scratch', false, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'alex@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Photography', 'PHOTOGRAPHY', 'ADVANCED',
       'Portrait, landscape, and product photography. Lightroom & Photoshop editing.', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'sarah@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Korean Language', 'LANGUAGE', 'BEGINNER',
       'Looking for Korean language partner, interested in K-culture', false, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'sarah@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Business Analytics', 'BUSINESS', 'INTERMEDIATE',
       'Excel, Power BI, SQL for business insights and reporting', true, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'bekzat@mail.com';

INSERT INTO skills (skill_id, profile_id, title, category, proficiency_level, description, is_offered, is_active, created_at)
SELECT gen_random_uuid(), sp.profile_id, 'Cooking — Kazakh Cuisine', 'COOKING', 'BEGINNER',
       'Want to master traditional Kazakh dishes', false, true, NOW()
FROM skill_profiles sp JOIN users u ON sp.user_id = u.user_id WHERE u.email = 'bekzat@mail.com';

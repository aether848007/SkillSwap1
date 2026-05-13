package com.skillswap.config;

import com.skillswap.model.*;
import com.skillswap.model.enums.*;
import com.skillswap.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.UUID;

@Profile("!postgres")
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository userRepo;
    private final SkillProfileRepository profileRepo;
    private final SkillRepository skillRepo;
    private final SessionRepository sessionRepo;
    private final RatingRepository ratingRepo;
    private final MessageRepository messageRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository u, SkillProfileRepository sp, SkillRepository sk,
                      SessionRepository se, RatingRepository r, MessageRepository m, PasswordEncoder e) {
        this.userRepo = u; this.profileRepo = sp; this.skillRepo = sk;
        this.sessionRepo = se; this.ratingRepo = r; this.messageRepo = m; this.encoder = e;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) return;

        // Users
        User asel = new User(); asel.setEmail("asel@mail.com"); asel.setDisplayName("Asel Nurbekova");
        asel.setPassword(encoder.encode("password123")); asel.setRole(UserRole.LEARNER);
        asel.setBio("CS student passionate about Python and AI. Looking to improve my English skills.");
        asel.setCity("Almaty"); asel.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Asel");
        asel = userRepo.save(asel);

        User dmitri = new User(); dmitri.setEmail("dmitri@mail.com"); dmitri.setDisplayName("Dmitri Volkov");
        dmitri.setPassword(encoder.encode("password123")); dmitri.setRole(UserRole.LEARNER);
        dmitri.setBio("Freelance graphic designer with 10 years of experience. Want to learn Python for automation.");
        dmitri.setCity("Astana"); dmitri.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitri");
        dmitri = userRepo.save(dmitri);

        User mira = new User(); mira.setEmail("mira@mail.com"); mira.setDisplayName("Mira Sadvakassova");
        mira.setPassword(encoder.encode("password123")); mira.setRole(UserRole.ADMIN);
        mira.setBio("Platform moderator ensuring community safety and quality.");
        mira.setCity("Astana"); mira.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Mira");
        mira = userRepo.save(mira);

        User alex = new User(); alex.setEmail("alex@mail.com"); alex.setDisplayName("Alexander Kim");
        alex.setPassword(encoder.encode("password123")); alex.setRole(UserRole.LEARNER);
        alex.setBio("Full-stack developer and music enthusiast. I teach JavaScript and want to learn guitar.");
        alex.setCity("Almaty"); alex.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Alex");
        alex = userRepo.save(alex);

        User sarah = new User(); sarah.setEmail("sarah@mail.com"); sarah.setDisplayName("Sarah Omarova");
        sarah.setPassword(encoder.encode("password123")); sarah.setRole(UserRole.LEARNER);
        sarah.setBio("Professional photographer and cooking enthusiast. Teaching photography in exchange for language lessons.");
        sarah.setCity("Shymkent"); sarah.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah");
        sarah = userRepo.save(sarah);

        User bekzat = new User(); bekzat.setEmail("bekzat@mail.com"); bekzat.setDisplayName("Bekzat Yermek");
        bekzat.setPassword(encoder.encode("password123")); bekzat.setRole(UserRole.LEARNER);
        bekzat.setBio("Business analyst and yoga instructor. Offering business analytics in exchange for cooking classes.");
        bekzat.setCity("Astana"); bekzat.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Bekzat");
        bekzat = userRepo.save(bekzat);

        // Skill Profiles
        SkillProfile p1 = new SkillProfile(); p1.setUser(asel); p1.setAverageRating(4.8); p1.setTotalSessions(12); profileRepo.save(p1);
        SkillProfile p2 = new SkillProfile(); p2.setUser(dmitri); p2.setAverageRating(4.9); p2.setTotalSessions(8); profileRepo.save(p2);
        SkillProfile p3 = new SkillProfile(); p3.setUser(mira); p3.setAverageRating(5.0); p3.setTotalSessions(3); profileRepo.save(p3);
        SkillProfile p4 = new SkillProfile(); p4.setUser(alex); p4.setAverageRating(4.6); p4.setTotalSessions(15); profileRepo.save(p4);
        SkillProfile p5 = new SkillProfile(); p5.setUser(sarah); p5.setAverageRating(4.7); p5.setTotalSessions(9); profileRepo.save(p5);
        SkillProfile p6 = new SkillProfile(); p6.setUser(bekzat); p6.setAverageRating(4.5); p6.setTotalSessions(6); profileRepo.save(p6);

        // Skills offered
        createSkill("Python Programming", SkillCategory.PROGRAMMING, ProficiencyLevel.ADVANCED, "Advanced Python with Django/Flask, data science with pandas and numpy", true, p1);
        createSkill("English Conversation", SkillCategory.LANGUAGE, ProficiencyLevel.INTERMEDIATE, "Looking for English practice partner for IELTS prep", false, p1);
        createSkill("Graphic Design", SkillCategory.DESIGN, ProficiencyLevel.ADVANCED, "Adobe Photoshop, Illustrator, Figma — branding, UI/UX, and print design", true, p2);
        createSkill("Python Basics", SkillCategory.PROGRAMMING, ProficiencyLevel.BEGINNER, "Want to learn Python for automating design workflows", false, p2);
        createSkill("JavaScript / React", SkillCategory.PROGRAMMING, ProficiencyLevel.ADVANCED, "Full-stack JS: React, Node.js, Next.js, TypeScript", true, p4);
        createSkill("Guitar Playing", SkillCategory.MUSIC, ProficiencyLevel.BEGINNER, "Want to learn acoustic guitar from scratch", false, p4);
        createSkill("Photography", SkillCategory.PHOTOGRAPHY, ProficiencyLevel.ADVANCED, "Portrait, landscape, and product photography. Lightroom & Photoshop editing.", true, p5);
        createSkill("Korean Language", SkillCategory.LANGUAGE, ProficiencyLevel.BEGINNER, "Looking for Korean language partner, interested in K-culture", false, p5);
        createSkill("Business Analytics", SkillCategory.BUSINESS, ProficiencyLevel.INTERMEDIATE, "Excel, Power BI, SQL for business insights and reporting", true, p6);
        createSkill("Cooking — Kazakh Cuisine", SkillCategory.COOKING, ProficiencyLevel.BEGINNER, "Want to master traditional Kazakh dishes", false, p6);
        createSkill("Data Science", SkillCategory.PROGRAMMING, ProficiencyLevel.INTERMEDIATE, "Machine learning basics, scikit-learn, TensorFlow intro", true, p1);
        createSkill("UI/UX Design", SkillCategory.DESIGN, ProficiencyLevel.INTERMEDIATE, "Mobile app design, wireframing, prototyping in Figma", true, p2);

        // Sessions
        Session s1 = new Session(); s1.setLearner(dmitri); s1.setProvider(asel); s1.setSkill(skillRepo.findAll().get(0));
        s1.setStatus(SessionStatus.COMPLETED); s1.setScheduledAt(LocalDateTime.now().minusDays(5)); s1.setDurationMinutes(60);
        s1.setNotes("Intro to Python for design automation"); sessionRepo.save(s1);

        Session s2 = new Session(); s2.setLearner(alex); s2.setProvider(sarah); s2.setSkill(skillRepo.findAll().get(6));
        s2.setStatus(SessionStatus.CONFIRMED); s2.setScheduledAt(LocalDateTime.now().plusDays(2)); s2.setDurationMinutes(45);
        s2.setNotes("Portrait photography basics"); sessionRepo.save(s2);

        Session s3 = new Session(); s3.setLearner(bekzat); s3.setProvider(alex); s3.setSkill(skillRepo.findAll().get(4));
        s3.setStatus(SessionStatus.REQUESTED); s3.setScheduledAt(LocalDateTime.now().plusDays(4)); s3.setDurationMinutes(60);
        s3.setNotes("JavaScript fundamentals for data dashboards"); sessionRepo.save(s3);

        // Ratings
        Rating r1 = new Rating(); r1.setSession(s1); r1.setRater(dmitri); r1.setRatee(asel);
        r1.setScore(5); r1.setComment("Excellent teacher! Made Python easy to understand."); ratingRepo.save(r1);

        Rating r2 = new Rating(); r2.setSession(s1); r2.setRater(asel); r2.setRatee(dmitri);
        r2.setScore(5); r2.setComment("Great student, very engaged and asked good questions."); ratingRepo.save(r2);

        // Messages
        UUID convId = UUID.randomUUID();
        Message m1 = new Message(); m1.setConversationId(convId); m1.setSender(dmitri); m1.setReceiver(asel);
        m1.setContent("Hi Asel! I saw you offer Python lessons. I'd love to exchange — I can teach you Figma and Graphic Design!"); messageRepo.save(m1);
        Message m2 = new Message(); m2.setConversationId(convId); m2.setSender(asel); m2.setReceiver(dmitri);
        m2.setContent("Hey Dmitri! That sounds perfect. I've been wanting to learn Figma for my projects. When are you free?"); messageRepo.save(m2);
        Message m3 = new Message(); m3.setConversationId(convId); m3.setSender(dmitri); m3.setReceiver(asel);
        m3.setContent("I'm available Thursday and Friday afternoons. Should we start with a 1-hour session?"); messageRepo.save(m3);

        System.out.println("=== SkillSwap Demo Data Loaded: " + userRepo.count() + " users, " + skillRepo.count() + " skills ===");
    }

    private void createSkill(String title, SkillCategory cat, ProficiencyLevel level, String desc, boolean offered, SkillProfile profile) {
        Skill s = new Skill(); s.setTitle(title); s.setCategory(cat); s.setProficiencyLevel(level);
        s.setDescription(desc); s.setIsOffered(offered); s.setIsActive(true); s.setSkillProfile(profile);
        skillRepo.save(s);
    }
}

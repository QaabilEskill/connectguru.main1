
-- Drop unused tables (CASCADE removes dependent policies/triggers)
DROP TABLE IF EXISTS public.bookmarks CASCADE;
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.custom_voices CASCADE;
DROP TABLE IF EXISTS public.daily_hadith CASCADE;
DROP TABLE IF EXISTS public.duas CASCADE;
DROP TABLE IF EXISTS public.islamic_stories CASCADE;
DROP TABLE IF EXISTS public.motivational_stories CASCADE;
DROP TABLE IF EXISTS public.quranic_words CASCADE;
DROP TABLE IF EXISTS public.vocabulary CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.structured_lessons CASCADE;
DROP TABLE IF EXISTS public.quiz_levels CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.quiz_tests CASCADE;
DROP TABLE IF EXISTS public.public_chat_messages CASCADE;
DROP TABLE IF EXISTS public.user_chat_warnings CASCADE;
DROP TABLE IF EXISTS public.user_activity CASCADE;
DROP TABLE IF EXISTS public.user_information CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.user_lesson_attempts CASCADE;
DROP TABLE IF EXISTS public.user_lesson_progress CASCADE;
DROP TABLE IF EXISTS public.user_story_progress CASCADE;
DROP TABLE IF EXISTS public.user_quiz_results CASCADE;
DROP TABLE IF EXISTS public.user_test_results CASCADE;
DROP TABLE IF EXISTS public.user_xp_system CASCADE;
DROP TABLE IF EXISTS public.xp_activities CASCADE;
DROP TABLE IF EXISTS public.mentor_applications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Drop unused functions
DROP FUNCTION IF EXISTS public.award_points_for_activity(uuid, text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.award_chat_points() CASCADE;
DROP FUNCTION IF EXISTS public.award_xp(uuid, text, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_xp_leaderboard_with_user_rank(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_leaderboard_with_user_rank(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_enhanced_leaderboard(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_rank(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_total_activities(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.record_completion(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_course_referral_code(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.redeem_course_referral_code(text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.grant_course_access(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_college_user_test_attempts(uuid) CASCADE;

-- 1. Get User Stats
CREATE OR REPLACE FUNCTION get_user_stats(uid UUID)
RETURNS jsonb AS $$
DECLARE
  today_count INT;
  week_count INT;
  month_count INT;
  total_count INT;
  active_projects INT;
  current_streak INT := 0;
  max_streak INT := 0;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE activity_date = CURRENT_DATE),
    COUNT(*) FILTER (WHERE activity_date >= date_trunc('week', CURRENT_DATE)::DATE),
    COUNT(*) FILTER (WHERE activity_date >= date_trunc('month', CURRENT_DATE)::DATE),
    COUNT(*)
  INTO today_count, week_count, month_count, total_count
  FROM activities
  WHERE user_id = uid;

  SELECT COUNT(DISTINCT project_id) INTO active_projects
  FROM activities
  WHERE user_id = uid;

  WITH dates AS (
    SELECT DISTINCT activity_date AS d
    FROM activities
    WHERE user_id = uid
  ),
  groups AS (
    SELECT d, d - (ROW_NUMBER() OVER(ORDER BY d))::INT AS grp
    FROM dates
  ),
  streaks AS (
    SELECT grp, COUNT(*) as streak_len, MAX(d) as end_date
    FROM groups
    GROUP BY grp
  )
  SELECT MAX(streak_len) INTO max_streak FROM streaks;

  SELECT streak_len INTO current_streak FROM streaks
  WHERE end_date >= CURRENT_DATE - 1
  ORDER BY end_date DESC LIMIT 1;

  RETURN json_build_object(
    'today', COALESCE(today_count, 0),
    'thisWeek', COALESCE(week_count, 0),
    'thisMonth', COALESCE(month_count, 0),
    'totalActivities', COALESCE(total_count, 0),
    'streak', COALESCE(current_streak, 0),
    'longestStreak', COALESCE(max_streak, 0),
    'activeProjects', COALESCE(active_projects, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Admin Stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb AS $$
DECLARE
  u_count INT;
  p_count INT;
  a_count INT;
  i_count INT;
BEGIN
  SELECT COUNT(*) INTO u_count FROM users;
  SELECT COUNT(*) INTO p_count FROM projects;
  SELECT COUNT(*) INTO a_count FROM activities;
  SELECT COUNT(*) INTO i_count FROM activity_images;
  
  RETURN json_build_object(
    'totalUsers', u_count,
    'totalProjects', p_count,
    'totalActivities', a_count,
    'totalImages', i_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Activity Trend
CREATE OR REPLACE FUNCTION get_activity_trend(start_d DATE, end_d DATE, uid UUID DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  res jsonb;
BEGIN
  SELECT json_agg(
    json_build_object('date', to_char(dates.d, 'YYYY-MM-DD'), 'count', COALESCE(acts.c, 0))
  ) INTO res
  FROM (
    SELECT d::DATE
    FROM generate_series(start_d, end_d, '1 day'::interval) d
  ) dates
  LEFT JOIN (
    SELECT activity_date, COUNT(*) as c
    FROM activities
    WHERE (uid IS NULL OR user_id = uid)
    GROUP BY activity_date
  ) acts ON dates.d = acts.activity_date;
  
  RETURN COALESCE(res, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Activities By Project
CREATE OR REPLACE FUNCTION get_activities_by_project(uid UUID DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  res jsonb;
BEGIN
  SELECT json_agg(
    json_build_object('projectId', project_id, 'count', c)
  ) INTO res
  FROM (
    SELECT project_id, COUNT(*) as c
    FROM activities
    WHERE (uid IS NULL OR user_id = uid)
    GROUP BY project_id
    ORDER BY c DESC
  ) as t;

  RETURN COALESCE(res, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Get Top Users
CREATE OR REPLACE FUNCTION get_top_users(limit_count INT DEFAULT 5)
RETURNS jsonb AS $$
DECLARE
  res jsonb;
BEGIN
  SELECT json_agg(
    json_build_object('userId', user_id, 'count', c)
  ) INTO res
  FROM (
    SELECT user_id, COUNT(*) as c
    FROM activities
    GROUP BY user_id
    ORDER BY c DESC
    LIMIT limit_count
  ) as t;

  RETURN COALESCE(res, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

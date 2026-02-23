-- Migration: Add automatic progress rollup for parent goals
-- When a child goal's progress changes, update the parent goal's progress
-- to the average of all its children's progress

-- Function to recalculate parent goal progress based on children
CREATE OR REPLACE FUNCTION calculate_parent_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  parent_id UUID;
  avg_progress INTEGER;
  child_count INTEGER;
BEGIN
  -- Get the parent_goal_id from the affected row
  -- Use NEW for INSERT/UPDATE, OLD for DELETE
  IF TG_OP = 'DELETE' THEN
    parent_id := OLD.parent_goal_id;
  ELSE
    parent_id := NEW.parent_goal_id;

    -- If parent changed, also update the old parent
    IF TG_OP = 'UPDATE' AND OLD.parent_goal_id IS DISTINCT FROM NEW.parent_goal_id THEN
      -- Update old parent's progress
      IF OLD.parent_goal_id IS NOT NULL THEN
        SELECT COUNT(*), COALESCE(AVG(progress_percent), 0)::INTEGER
        INTO child_count, avg_progress
        FROM goals
        WHERE parent_goal_id = OLD.parent_goal_id;

        IF child_count > 0 THEN
          UPDATE goals
          SET progress_percent = avg_progress,
              updated_at = NOW()
          WHERE id = OLD.parent_goal_id;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Update the current parent's progress
  IF parent_id IS NOT NULL THEN
    SELECT COUNT(*), COALESCE(AVG(progress_percent), 0)::INTEGER
    INTO child_count, avg_progress
    FROM goals
    WHERE parent_goal_id = parent_id;

    IF child_count > 0 THEN
      UPDATE goals
      SET progress_percent = avg_progress,
          updated_at = NOW()
      WHERE id = parent_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_goal_progress_rollup ON goals;

-- Create trigger to fire on goal INSERT, UPDATE, or DELETE
CREATE TRIGGER trigger_goal_progress_rollup
AFTER INSERT OR UPDATE OF progress_percent, parent_goal_id OR DELETE
ON goals
FOR EACH ROW
EXECUTE FUNCTION calculate_parent_goal_progress();

-- Comment explaining the feature
COMMENT ON FUNCTION calculate_parent_goal_progress() IS
  'Automatically recalculates parent goal progress as the average of all child goals progress';

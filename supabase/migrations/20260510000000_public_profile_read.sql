-- Allow any authenticated user to read profiles (needed to display reviewer names)
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

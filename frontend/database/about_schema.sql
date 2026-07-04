-- About Us content: journey milestones and team members
-- Run this SQL in your PostgreSQL database

CREATE TABLE IF NOT EXISTS public.journey_milestones (
    id SERIAL PRIMARY KEY,
    year VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(500),
    display_order INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_milestones_display_order ON public.journey_milestones(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON public.team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

CREATE OR REPLACE FUNCTION update_about_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_journey_milestones_updated_at ON public.journey_milestones;
CREATE TRIGGER update_journey_milestones_updated_at
    BEFORE UPDATE ON public.journey_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_about_updated_at();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_about_updated_at();

-- Seed with existing hardcoded content (only if tables are empty)
INSERT INTO public.journey_milestones (year, title, description, display_order)
SELECT * FROM (VALUES
    ('1998', 'Founded', 'Started as a small family business in Kashmir', 1),
    ('2005', 'Certification', 'Received ISO certification for quality standards', 2),
    ('2012', 'Expansion', 'Expanded to serve customers across India', 3),
    ('2018', 'Digital', 'Launched online platform for nationwide delivery', 4),
    ('2024', 'Excellence', 'Serving 10,000+ satisfied customers worldwide', 5)
) AS seed(year, title, description, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.journey_milestones LIMIT 1);

INSERT INTO public.team_members (name, designation, description, image, display_order, status)
SELECT * FROM (VALUES
    ('Rajesh Kumar', 'Founder & CEO', '25+ years of experience in saffron cultivation and trade', 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2', 1, 'active'),
    ('Priya Sharma', 'Quality Manager', 'Expert in saffron quality testing and certification', 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2', 2, 'active'),
    ('Mohammed Ali', 'Head of Operations', 'Manages supply chain and farmer relationships', 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&dpr=2', 3, 'active')
) AS seed(name, designation, description, image, display_order, status)
WHERE NOT EXISTS (SELECT 1 FROM public.team_members LIMIT 1);

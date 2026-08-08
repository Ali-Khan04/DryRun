# DryRun

A browser-based sandbox for learning robotics concepts - no installation required.

Robotics education has a steep barrier before anyone gets to the interesting part: installing Ubuntu, configuring ROS2, setting up Gazebo, and debugging a simulation environment just to get started. Gazebo's physics and sensor rendering also lean heavily on GPU resources, which makes it slow or unusable on the integrated graphics found in a lot of student laptops - so even a correct install does not guarantee a usable simulation. DryRun removes both barriers. Open a tab and start experimenting with path planning, sensors, and mapping directly in the browser, with 2D rendering light enough to run on modest hardware.

## What DryRun Does

DryRun is a visual, interactive sandbox for building intuition around core robotics concepts. Rather than reproducing a full robotics simulation stack, it focuses on making cause and effect immediately visible - toggle a setting, see the result, understand why it matters.

Current features:

- Canvas-based environment editor for building custom layouts
- Session persistence via Supabase, so layouts and progress carry over between visits

## Roadmap

DryRun is under active development. Planned additions, in order:

1. **Path planning visualizer** - watch A* and Dijkstra explore a grid in real time, with step-through mode to see each node expansion
2. **Simulated sensors** - compare simulated LiDAR (full sweep) against simulated ultrasonic (short-range cones) in the same environment, to build intuition for why sensor choice matters
3. **Simulated mapping** - a robot moving through an environment accumulates sensor readings into a map that visibly builds up over time, illustrating how robots construct maps from incremental partial observations

These are teaching visualizations of the underlying concepts, not a reproduction of production robotics algorithms - the goal is intuition, not research-grade accuracy.

## Tech Stack

React, TypeScript, Vite, HTML Canvas, Supabase

## Status

Actively developed, pre-1.0. Contributions and feedback welcome once the repository is open for them.

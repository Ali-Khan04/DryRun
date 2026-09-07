import { ModeInfoModal } from './ModeInfoModal';
import { StatusBar } from './components/StatusBar';
import { ToolbarHeader } from './components/ToolbarHeader';
import { AlgorithmSection } from './sections/AlgorithmSection';
import { DrawModeSection } from './sections/DrawModeSection';
import { GlobalSearchSection } from './sections/GlobalSearchSection';
import { PlanningModeSection } from './sections/PlanningModeSection';
import { ReactiveExploreSection } from './sections/ReactiveExploreSection';
import { RobotSection } from './sections/RobotSection';
import { SensorSection } from './sections/SensorSection';
import { SlamMapSection } from './sections/SlamMapSection';
import { SlamPlanSection } from './sections/SlamPlanSection';
import { useToolbarController } from './useToolbarController';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const toolbar = useToolbarController();
  const { state, runner, walker, explorer, planner } = toolbar;

  return (
    <div className={styles.toolbar}>
      <ToolbarHeader
        activeModeLabel={toolbar.activeModeLabel}
        onHelp={toolbar.showCurrentModeInfo}
      />

      <div className={styles.body}>
        <DrawModeSection
          drawMode={state.drawMode}
          isRunning={state.isRunning}
          canUndo={toolbar.canUndo}
          hasEndpoints={toolbar.hasEndpoints}
          isGridEmpty={toolbar.isGridEmpty}
          onDrawModeChange={toolbar.handleDrawModeChange}
          onUndo={toolbar.undo}
          onClearEndpoints={toolbar.handleClearEndpoints}
          onClearGrid={toolbar.handleClearGrid}
        />

        <PlanningModeSection
          planningMode={state.planningMode}
          isRunning={state.isRunning}
          onModeChange={toolbar.handlePlanningModeChange}
          onShowInfo={toolbar.showCurrentModeInfo}
        />

        {toolbar.showAlgorithmSection && (
          <AlgorithmSection
            algorithm={state.algorithm}
            isRunning={state.isRunning}
            collapsed={toolbar.collapsed.algorithm}
            openInfo={toolbar.openInfo}
            onToggleInfo={toolbar.toggleInfo}
            onToggleCollapse={() => toolbar.toggleSection('algorithm')}
            onAlgorithmChange={toolbar.handleAlgorithmChange}
          />
        )}

        {toolbar.showSensorSection && (
          <SensorSection
            sensorMode={state.sensorMode}
            isRunning={state.isRunning}
            collapsed={toolbar.collapsed.sensor}
            openInfo={toolbar.openInfo}
            onToggleInfo={toolbar.toggleInfo}
            onToggleCollapse={() => toolbar.toggleSection('sensor')}
            onSensorModeChange={toolbar.handleSensorModeChange}
          />
        )}

        {state.planningMode === 'global' && (
          <GlobalSearchSection runner={runner} />
        )}

        {state.planningMode === 'reactive' && (
          <ReactiveExploreSection
            explorer={explorer}
            openInfo={toolbar.openInfo}
            onToggleInfo={toolbar.toggleInfo}
            onPause={toolbar.handleExplorePause}
          />
        )}

        {state.planningMode === 'slam' && (
          <>
            <SlamMapSection
              explorer={explorer}
              openInfo={toolbar.openInfo}
              onToggleInfo={toolbar.toggleInfo}
              onUseMap={toolbar.handleMapPause}
            />
            <SlamPlanSection
              planner={planner}
              algorithm={state.algorithm}
              openInfo={toolbar.openInfo}
              onToggleInfo={toolbar.toggleInfo}
            />
          </>
        )}

        <RobotSection
          walker={walker}
          openInfo={toolbar.openInfo}
          onToggleInfo={toolbar.toggleInfo}
        />
      </div>

      <StatusBar active={toolbar.statusActive} message={state.statusMsg} />

      {toolbar.modalKind && (
        <ModeInfoModal
          kind={toolbar.modalKind}
          onClose={toolbar.closeModal}
          {...(toolbar.modalKind === 'welcome'
            ? {
                primaryLabel: 'Show me around',
                onPrimary: toolbar.startTour,
                secondaryLabel: "Skip, I'll explore",
                onSecondary: toolbar.closeModal,
              }
            : {})}
        />
      )}
    </div>
  );
}
